import { ServiceTypeService } from './../serviceType/serviceType.service';
import {
	Injectable,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import {
	Booking,
	BookingDocument,
	BookingStatus,
} from './entities/booking.entity';
import { CreateBookingDTO } from './dto/createBooking.dto';
import { RoomService } from '../room/room.service';
import { ServiceService } from '../service/service.service';
import { PromotionService } from '../promotion/promotion.service';
import { ServiceStatus } from '../service/enums/service-status.enum';
import { UserPromotionService } from '../promotion/userPromotion.service';
import { Room } from '../room/entities/room.entity';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { CreateInvoiceDto } from '../invoice/dto/createInvoice.dto';
import { Invoice } from '../invoice/entities/invoice.entity';
import { InvoiceService } from '../invoice/invoice.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { BookingServiceDTO } from './dto/bookingService.dto';
import { User, UserRole } from '../user/entities/user.entity';

@Injectable()
export class BookingService {
	constructor(
		@InjectModel(Booking.name)
		private readonly bookingModel: Model<BookingDocument>,
		private readonly roomService: RoomService,
		private readonly serviceService: ServiceService,
		private readonly promotionService: PromotionService,
		private readonly userPromotionService: UserPromotionService,
		private readonly invoiceService: InvoiceService,
		private readonly configService: ConfigService,
		private readonly emailService: EmailService,
		private readonly userService: UserService,
		private readonly serviceTypeService: ServiceTypeService,
	) {}

	async createBooking(
		roomId: string,
		userId: string,
		dto: CreateBookingDTO,
	): Promise<Booking> {
		const room = await this.roomService.findOne(roomId);

		if (dto.checkinDate >= dto.checkoutDate) {
			throw new BadRequestException(
				'Check-in date must be before check-out date',
			);
		}
		const totalNight =
			(dto.checkoutDate.getTime() - dto.checkinDate.getTime()) /
			(1000 * 60 * 60 * 24);
		let totalAmount = room.pricePerNight * totalNight;

		if (dto.promotionId) {
			try {
				await this.userPromotionService.usePromotion(userId, dto.promotionId);

				const promotion = await this.promotionService.getPromotionById(
					dto.promotionId,
				);
				totalAmount = totalAmount * (1 - promotion.discount / 100);
			} catch (error) {
				if (error instanceof BadRequestException) {
					throw error;
				}
				if (error.status === 404) {
					throw new NotFoundException(
						`Promotion with ID ${dto.promotionId} not found`,
					);
				}
				throw error;
			}
		}

		// Process services with status
		let bookingServices = [];
		if (dto.serviceIds?.length) {
			const services = await this.serviceService.findByIds(dto.serviceIds);
			if (services.length !== dto.serviceIds.length) {
				throw new NotFoundException('One or more services not found');
			}
			totalAmount += services.reduce((sum, service) => sum + service.price, 0);

			// Create booking services with Pending status
			bookingServices = services.map((service) => ({
				serviceId: service._id as ObjectId,
				status: ServiceStatus.Pending,
				price: service.price,
				quantity: 1,
				name: service.serviceName,
			}));
		}

		const booking = await this.bookingModel.create({
			roomId,
			customerId: userId,
			checkinDate: dto.checkinDate,
			checkoutDate: dto.checkoutDate,
			services: bookingServices,
			promotionId: dto.promotionId,
			totalAmount,
			status: BookingStatus.Pending,
		});

		return booking;
	}

	async getBookings(
		query: PaginateParams,
		filter?: 'pending' | 'checked in' | 'checked out',
	): Promise<PaginateData<Booking>> {
		const {
			page = 1,
			limit = 10,
			sortBy = 'createdAt',
			sortOrder = SortOrder.DESC,
		} = query;

		const skip = (page - 1) * limit;
		const sortOptions: Record<string, 1 | -1> = {
			[sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
		};

		const filterConditions: any = {};

		if (filter === 'pending') {
			filterConditions.status = BookingStatus.Pending;
		} else if (filter === 'checked in') {
			filterConditions.status = BookingStatus.CheckedIn;
		} else if (filter === 'checked out') {
			filterConditions.status = BookingStatus.CheckedOut;
		}

		const [count, bookings] = await Promise.all([
			this.bookingModel.countDocuments(filterConditions).exec(),
			this.bookingModel
				.find(filterConditions)
				.sort(sortOptions)
				.skip(skip)
				.limit(limit)
				.populate({
					path: 'roomId',
					populate: {
						path: 'roomTypeId',
						select: 'typeName',
					},
				})
				.populate('customerId', '-password')
				.populate('services.serviceId')
				.populate('promotionId')
				.populate('roomId.roomTypeId')
				.exec(),
		]);

		const totalPages = Math.ceil(count / limit);

		return {
			docs: bookings,
			totalDocs: count,
			page,
			limit,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			pagingCounter: skip + 1,
		};
	}

	async getBookingById(id: string): Promise<Booking> {
		const booking = await this.bookingModel
			.findById(id)
			.populate({
				path: 'roomId',
				populate: {
					path: 'roomTypeId',
					select: 'typeName',
				},
			})
			.populate({ path: 'customerId', select: '-password' })
			.populate('services.serviceId')
			.populate('promotionId')
			.exec();

		if (!booking) {
			throw new NotFoundException(`Booking with ID ${id} not found`);
		}

		return booking;
	}

	async updateBookingStatus(
		id: string,
		status: BookingStatus,
	): Promise<Booking> {
		const booking = await this.bookingModel.findById(id).exec();

		if (!booking) {
			throw new NotFoundException(`Booking with ID ${id} not found`);
		}

		booking.status = status;
		await booking.save();

		return booking;
	}

	async checkIn(id: string): Promise<Booking> {
		const booking = await this.bookingModel.findById(id);
		if (!booking) {
			throw new NotFoundException(`Booking with ID ${id} not found`);
		}

		if (booking.status !== BookingStatus.Pending) {
			throw new BadRequestException('Booking must be pending before check-in');
		}

		booking.status = BookingStatus.CheckedIn;
		await booking.save();
		return booking;
	}

	async checkoutBooking(bookingId: string): Promise<Invoice> {
		const booking = await this.bookingModel
			.findById(bookingId)
			.populate('roomId')
			.populate('services.serviceId')
			.exec();

		if (!booking) {
			throw new NotFoundException(`Booking with ID ${bookingId} not found`);
		}

		if (booking.status !== BookingStatus.CheckedIn) {
			throw new BadRequestException(
				'Booking must be checked in before checkout',
			);
		}

		const room = booking.roomId as unknown as Room;

		const totalNight =
			(booking.checkoutDate.getTime() - booking.checkinDate.getTime()) /
			(1000 * 60 * 60 * 24);

		const items = [
			{
				name: room.roomNumber,
				quantity: totalNight,
				price: room.pricePerNight,
			},
			...booking.services.map((service) => ({
				name: service.name,
				quantity: service.quantity,
				price: service.price,
			})),
		];

		const createInvoiceDto: CreateInvoiceDto = {
			userId: booking.customerId.toString(),
			amount: booking.totalAmount,
			description: 'Thanh toan don hang',
			returnUrl:
				this.configService.get('BACKEND_URL') +
				'/invoices/update-invoice-status',
			cancelUrl:
				this.configService.get('BACKEND_URL') +
				'/invoices/update-invoice-status',
			issueDate: new Date(),
			dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
			items,
			bookingId: bookingId,
		};

		const customer = await this.userService.getUser(
			booking.customerId.toString(),
		);

		console.log('customer', customer);

		const invoice = await this.invoiceService.createInvoice(createInvoiceDto);

		await this.emailService.sendInvoiceEmail(
			customer.email,
			customer.firstName,
			items.map((item) => ({
				name: item.name,
				amount: item.price * item.quantity,
			})),
			invoice.checkoutUrl,
		);

		booking.status = BookingStatus.CheckedOut;
		await booking.save();

		return invoice;
	}

	async addServiceToBooking(
		bookingId: string,
		serviceId: string,
	): Promise<Booking> {
		const booking = await this.bookingModel.findById(bookingId).exec();

		if (!booking) {
			throw new NotFoundException(`Booking with ID ${bookingId} not found`);
		}

		const service = await this.serviceService.findOne(serviceId);
		if (!service) {
			throw new NotFoundException(`Service with ID ${serviceId} not found`);
		}

		const existingService = booking.services.find(
			(s) => s.serviceId.toString() === serviceId,
		);

		if (existingService) {
			existingService.quantity += 1;
		} else {
			booking.services.push({
				serviceId: new Types.ObjectId(serviceId),
				status: ServiceStatus.Pending,
				price: service.price,
				quantity: 1,
				name: service.serviceName,
			});
		}

		booking.totalAmount += service.price;
		await booking.save();

		return booking;
	}

	async getBookingsByUserId(
		userId: string,
		query: PaginateParams,
		filter?: 'upcoming' | 'staying' | 'past',
	): Promise<PaginateData<Booking>> {
		const {
			page = 1,
			limit = 10,
			sortBy = 'createdAt',
			sortOrder = SortOrder.DESC,
		} = query;

		const skip = (page - 1) * limit;
		const sortOptions: Record<string, 1 | -1> = {
			[sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
		};

		const filterConditions: any = { customerId: userId };

		const currentDate = new Date();

		if (filter === 'upcoming') {
			filterConditions.checkinDate = { $gte: currentDate };
		} else if (filter === 'staying') {
			filterConditions.checkinDate = { $lte: currentDate };
			filterConditions.checkoutDate = { $gte: currentDate };
		} else if (filter === 'past') {
			filterConditions.checkoutDate = { $lt: currentDate };
		}

		const [count, bookings] = await Promise.all([
			this.bookingModel.countDocuments(filterConditions).exec(),
			this.bookingModel
				.find(filterConditions)
				.sort(sortOptions)
				.skip(skip)
				.limit(limit)
				.populate('roomId')
				.populate('services.serviceId')
				.populate('promotionId')
				.exec(),
		]);

		const totalPages = Math.ceil(count / limit);

		return {
			docs: bookings,
			totalDocs: count,
			page,
			limit,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			pagingCounter: skip + 1,
		};
	}

	async getBookingCountByStatus(): Promise<{
		pending: number;
		checkedIn: number;
		checkedOut: number;
	}> {
		const [pending, checkedIn, checkedOut] = await Promise.all([
			this.bookingModel
				.countDocuments({ status: BookingStatus.Pending })
				.exec(),
			this.bookingModel
				.countDocuments({ status: BookingStatus.CheckedIn })
				.exec(),
			this.bookingModel
				.countDocuments({ status: BookingStatus.CheckedOut })
				.exec(),
		]);

		return {
			pending,
			checkedIn,
			checkedOut,
		};
	}

	async getServiceStatusCount(user: User): Promise<{
		pending: number;
		served: number;
	}> {
		const bookings = await this.bookingModel.find().exec();

		let pending = 0;
		let served = 0;

		for (const booking of bookings) {
			if (!booking.services || booking.services.length === 0) {
				continue;
			}

			for (const service of booking.services as any[]) {
				const fullService = await this.serviceService.findOne(
					service.serviceId,
				);
				if (!fullService) continue;

				const fullServiceType = await this.serviceTypeService.findOne(
					fullService.serviceTypeId,
				);
				if (!fullServiceType) continue;

				if (user.role === UserRole.Service_Staff && user.serviceTypeId) {
					if (fullService.serviceTypeId !== user.serviceTypeId.toString()) {
						continue;
					}
				}

				if (service.status === ServiceStatus.Pending) {
					pending += 1;
				} else if (service.status === ServiceStatus.Served) {
					served += 1;
				}
			}
		}

		return {
			pending,
			served,
		};
	}

	async getAllBookingService(
		query: PaginateParams & { status?: string },
		user: User,
	): Promise<PaginateData<BookingServiceDTO>> {
		const {
			page = 1,
			limit = 10,
			sortBy = 'checkinDate',
			sortOrder = SortOrder.DESC,
			status,
		} = query;

		const skip = (page - 1) * limit;

		const bookings = await this.bookingModel.find().exec();
		const allDocs: BookingServiceDTO[] = [];

		for (const booking of bookings) {
			if (!booking.services || booking.services.length === 0) {
				continue;
			}

			const room = await this.roomService.findOne(booking.roomId.toString());

			for (const service of booking.services as any[]) {
				const fullService = await this.serviceService.findOne(
					service.serviceId,
				);

				const fullServiceType = await this.serviceTypeService.findOne(
					fullService.serviceTypeId,
				);
				if (user.role === UserRole.Service_Staff && user.serviceTypeId) {
					if (
						!fullService ||
						fullService.serviceTypeId !== user.serviceTypeId.toString()
					) {
						continue;
					}
				}

				if (status && service.status !== status) {
					continue;
				}

				allDocs.push({
					id: service.id,
					serviceName: service.name,
					serviceTypeName: fullServiceType.typeName,
					roomNumber: room.roomNumber,
					checkinDate: booking.checkinDate,
					checkoutDate: booking.checkoutDate,
					quantity: service.quantity,
					status: service.status,
					price: service.price,
				});
			}
		}

		// Sắp xếp dữ liệu
		const sortedDocs = allDocs.sort((a, b) => {
			if (sortOrder === SortOrder.ASC) {
				if (a[sortBy] > b[sortBy]) return 1;
				if (a[sortBy] < b[sortBy]) return -1;
				return 0;
			} else {
				if (a[sortBy] < b[sortBy]) return 1;
				if (a[sortBy] > b[sortBy]) return -1;
				return 0;
			}
		});

		// Phân trang
		const totalDocs = sortedDocs.length;
		const totalPages = Math.ceil(totalDocs / limit);

		const docs = sortedDocs.slice(skip, skip + limit);
		const hasNextPage = page < totalPages;
		const hasPrevPage = page > 1;
		const nextPage = hasNextPage ? page + 1 : null;
		const prevPage = hasPrevPage ? page - 1 : null;
		const pagingCounter = skip + 1;

		return {
			docs,
			totalDocs,
			page,
			limit,
			totalPages,
			hasNextPage,
			hasPrevPage,
			nextPage,
			prevPage,
			pagingCounter,
		};
	}

	async getBookingServicesByServiceType(
		query: PaginateParams & { status?: string },
		serviceTypeId: string,
	): Promise<PaginateData<BookingServiceDTO>> {
		if (!Types.ObjectId.isValid(serviceTypeId)) {
			throw new BadRequestException('Invalid ID format');
		}
		const {
			page = 1,
			limit = 10,
			sortBy = 'checkinDate',
			sortOrder = SortOrder.DESC,
			status,
		} = query;

		const skip = (page - 1) * limit;

		const bookings = await this.bookingModel.find().exec();
		const allDocs: BookingServiceDTO[] = [];

		for (const booking of bookings) {
			if (!booking.services || booking.services.length === 0) {
				continue;
			}

			const room = await this.roomService.findOne(booking.roomId.toString());

			for (const service of booking.services as any[]) {
				const fullService = await this.serviceService.findOne(
					service.serviceId,
				);
				if (fullService.serviceTypeId !== serviceTypeId) {
					continue;
				}

				const fullServiceType = await this.serviceTypeService.findOne(
					fullService.serviceTypeId,
				);

				if (status && service.status !== status) {
					continue;
				}

				allDocs.push({
					id: service.id,
					serviceName: service.name,
					serviceTypeName: fullServiceType.typeName,
					roomNumber: room.roomNumber,
					checkinDate: booking.checkinDate,
					checkoutDate: booking.checkoutDate,
					quantity: service.quantity,
					status: service.status,
					price: service.price,
				});
			}
		}

		const sortedDocs = allDocs.sort((a, b) => {
			if (sortOrder === SortOrder.ASC) {
				if (a[sortBy] > b[sortBy]) return 1;
				if (a[sortBy] < b[sortBy]) return -1;
				return 0;
			} else {
				if (a[sortBy] < b[sortBy]) return 1;
				if (a[sortBy] > b[sortBy]) return -1;
				return 0;
			}
		});

		const totalDocs = sortedDocs.length;
		const totalPages = Math.ceil(totalDocs / limit);

		const docs = sortedDocs.slice(skip, skip + limit);
		const hasNextPage = page < totalPages;
		const hasPrevPage = page > 1;
		const nextPage = hasNextPage ? page + 1 : null;
		const prevPage = hasPrevPage ? page - 1 : null;
		const pagingCounter = skip + 1;

		return {
			docs,
			totalDocs,
			page,
			limit,
			totalPages,
			hasNextPage,
			hasPrevPage,
			nextPage,
			prevPage,
			pagingCounter,
		};
	}

	async updateBookingServiceStatus(bookingServiceId: string): Promise<Booking> {
		if (!Types.ObjectId.isValid(bookingServiceId)) {
			throw new BadRequestException('Invalid ID format');
		}
		const booking = await this.bookingModel
			.findOne({
				'services._id': bookingServiceId,
			})
			.exec();

		if (!booking) {
			throw new NotFoundException(
				`Service with ID ${bookingServiceId} not found in any booking`,
			);
		}

		const service = booking.services.find(
			(service: any) => service._id.toString() === bookingServiceId,
		);

		if (!service) {
			throw new NotFoundException(
				`Service with ID ${bookingServiceId} not found in booking`,
			);
		}

		if (service.status !== ServiceStatus.Pending) {
			throw new BadRequestException('Service is already served or not pending');
		}

		service.status = ServiceStatus.Served;

		await booking.save();
		return booking;
	}
}
