import {
	Injectable,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';

import { RoomTypeService } from './../roomType/roomType.service';
import { ServiceTypeService } from './../serviceType/serviceType.service';
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
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { BookingServiceDTO } from './dto/bookingService.dto';
import { User, UserRole } from '../user/entities/user.entity';
import { RoomServiceService } from '../roomService/roomService.service';

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
		private readonly roomTypeService: RoomTypeService,
		private readonly roomServiceService: RoomServiceService,
	) {}

	private async createTransferInvoice(bookingId: string) {
		const booking = await this.findBookingById(bookingId);

		console.log('booking', booking);

		const room = booking.roomId as unknown as Room;

		const totalNight = Math.ceil(
			(booking.checkoutDate.getTime() - booking.checkinDate.getTime()) /
				(1000 * 60 * 60 * 24),
		);
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

		console.log('items', items);

		const customer = booking.customerId as unknown as User;

		const createInvoiceDto: CreateInvoiceDto = {
			userId: customer._id.toString(),
			amount: booking.totalAmount,
			description: 'Transfer booking',
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
			status: 'PENDING',
		};

		const invoice = await this.invoiceService.createInvoice(createInvoiceDto);

		await this.emailService.sendInvoiceEmail(
			customer.email,
			customer.firstName,
			items.map((item) => ({
				name: item.name,
				price: item.price,
				quantity: item.quantity,
			})),
			invoice.checkoutUrl,
			invoice.orderCode.toString(),
			booking.totalAmount,
		);

		return invoice;
	}

	async createBooking(
		roomId: string,
		userId: string,
		dto: CreateBookingDTO,
	): Promise<Booking | { booking: Booking; invoice: Invoice }> {
		const room = await this.roomService.findOne(roomId);

		if (dto.checkinDate >= dto.checkoutDate) {
			throw new BadRequestException(
				'Check-in date must be before check-out date',
			);
		}

		const overlappingBookings = await this.bookingModel
			.find({
				roomId,
				$or: [
					{
						checkinDate: { $lt: dto.checkoutDate },
						checkoutDate: { $gt: dto.checkinDate },
					},
				],
			})
			.exec();

		if (overlappingBookings.length > 0) {
			throw new BadRequestException(
				'The room is not available for the selected dates',
			);
		}

		const totalNight = Math.ceil(
			(dto.checkoutDate.getTime() - dto.checkinDate.getTime()) /
				(1000 * 60 * 60 * 24),
		);
		let totalAmount = room.pricePerNight * totalNight;

		let promotionId = null;
		if (dto.promotionId && dto.promotionId.trim()) {
			try {
				await this.userPromotionService.usePromotion(userId, dto.promotionId);
				const promotion = await this.promotionService.getPromotionById(
					dto.promotionId,
				);
				totalAmount = totalAmount * (1 - promotion.discount / 100);
				promotionId = dto.promotionId;
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

		let bookingServices = [];
		if (dto.servicesWithQuantities?.length) {
			const serviceIds = dto.servicesWithQuantities.map((s) => s.serviceId);
			const services = await this.serviceService.findByIds(serviceIds);
			if (services.length !== serviceIds.length) {
				throw new NotFoundException('One or more services not found');
			}
			totalAmount += dto.servicesWithQuantities.reduce((sum, service) => {
				const foundService = services.find(
					(s) => s._id.toString() === service.serviceId,
				);
				return sum + foundService.price * service.quantity;
			}, 0);

			bookingServices = dto.servicesWithQuantities.map((service) => {
				const foundService = services.find(
					(s) => s._id.toString() === service.serviceId,
				);
				return {
					serviceId: foundService._id as ObjectId,
					status: ServiceStatus.Pending,
					price: foundService.price,
					quantity: service.quantity,
					name: foundService.serviceName,
				};
			});
		}

		const booking = await this.bookingModel.create({
			roomId,
			customerId: userId,
			checkinDate: dto.checkinDate,
			checkoutDate: dto.checkoutDate,
			services: bookingServices,
			promotionId: promotionId,
			totalAmount,
			status: BookingStatus.Pending,
			guests: dto.guests,
			paymentMethod: dto.paymentMethod,
			paidAmount: dto.paymentMethod === 'Transfer' ? totalAmount : 0,
		});

		if (dto.paymentMethod === 'Transfer') {
			const invoice = await this.createTransferInvoice(booking._id.toString());
			return { booking, invoice };
		}

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

	async findBookingById(id: string): Promise<Booking> {
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

		const remainingAmount = booking.totalAmount - (booking.paidAmount || 0);

		const room = booking.roomId as unknown as Room;

		const totalNight = Math.ceil(
			(booking.checkoutDate.getTime() - booking.checkinDate.getTime()) /
				(1000 * 60 * 60 * 24),
		);

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
			...booking.roomServices.map((service) => ({
				name: service.name,
				quantity: service.quantity,
				price: service.price,
			})),
		];

		const createInvoiceDto: CreateInvoiceDto = {
			userId: booking.customerId.toString(),
			amount: remainingAmount === 0 ? 1 : remainingAmount,
			description:
				booking.paymentMethod === 'Transfer'
					? 'Remaining payment'
					: 'Full payment',
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
			status: 'PENDING',
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
				price: item.price,
				quantity: item.quantity,
			})),
			invoice.checkoutUrl,
			invoice.orderCode.toString(),
			remainingAmount === 0 ? 1 : remainingAmount,
		);

		booking.status = BookingStatus.CheckedOut;
		await booking.save();

		return invoice;
	}

	async addServiceToBooking(
		bookingId: string,
		serviceId: string,
		quantity: number,
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
			existingService.quantity += quantity;
		} else {
			booking.services.push({
				serviceId: new Types.ObjectId(serviceId),
				status: ServiceStatus.Pending,
				price: service.price,
				quantity,
				name: service.serviceName,
			});
		}

		booking.totalAmount += service.price * quantity;
		await booking.save();

		return booking;
	}

	async addRoomServicesToBooking(
		bookingId: string,
		roomServicesWithQuantities: { roomServiceId: string; quantity: number }[],
	): Promise<Booking> {
		const booking = await this.bookingModel.findById(bookingId).exec();

		if (!booking) {
			throw new NotFoundException(`Booking with ID ${bookingId} not found`);
		}

		const roomServiceIds = roomServicesWithQuantities.map(
			(s) => s.roomServiceId,
		);
		const roomServices =
			await this.roomServiceService.findByIds(roomServiceIds);
		if (roomServices.length !== roomServiceIds.length) {
			throw new NotFoundException('One or more room services not found');
		}

		booking.roomServices.forEach((service) => {
			booking.totalAmount -= service.price * service.quantity;
		});

		booking.roomServices = [];

		for (const { roomServiceId, quantity } of roomServicesWithQuantities) {
			if (isNaN(quantity) || quantity <= 0) {
				throw new BadRequestException('Quantity must be a positive number');
			}

			const roomService = roomServices.find((s) => s.id === roomServiceId);
			if (!roomService) {
				throw new NotFoundException(
					`Room service with ID ${roomServiceId} not found`,
				);
			}

			booking.roomServices.push({
				roomServiceId: new Types.ObjectId(roomServiceId),
				price: roomService.price,
				quantity,
				name: roomService.serviceName,
			});
			booking.totalAmount += roomService.price * quantity;
		}

		if (isNaN(booking.totalAmount)) {
			throw new BadRequestException('Total amount calculation resulted in NaN');
		}

		await booking.save();

		return booking;
	}

	async updateRoomServicesInBooking(
		bookingId: string,
		roomServices: { roomServiceId: string; quantity: number }[],
	): Promise<Booking> {
		const booking = await this.bookingModel.findById(bookingId).exec();

		if (!booking) {
			throw new NotFoundException(`Booking with ID ${bookingId} not found`);
		}

		for (const { roomServiceId, quantity } of roomServices) {
			if (isNaN(quantity) || quantity <= 0) {
				throw new BadRequestException('Quantity must be a positive number');
			}

			const roomService = await this.roomServiceService.findOne(roomServiceId);
			if (!roomService) {
				throw new NotFoundException(
					`Room service with ID ${roomServiceId} not found`,
				);
			}

			const existingService = booking.roomServices.find(
				(s) => s.roomServiceId.toString() === roomServiceId,
			);

			if (!existingService) {
				throw new NotFoundException(
					`Room service with ID ${roomServiceId} not found in booking`,
				);
			}

			booking.totalAmount -= existingService.price * existingService.quantity;
			existingService.quantity = quantity;
			booking.totalAmount += existingService.price * quantity;

			if (isNaN(booking.totalAmount)) {
				throw new BadRequestException(
					'Total amount calculation resulted in NaN',
				);
			}
		}

		await booking.save();

		return booking;
	}

	async removeRoomServiceFromBooking(
		bookingId: string,
		roomServiceId: string,
	): Promise<Booking> {
		const booking = await this.bookingModel.findById(bookingId).exec();

		if (!booking) {
			throw new NotFoundException(`Booking with ID ${bookingId} not found`);
		}

		const roomServiceIndex = booking.roomServices.findIndex(
			(s) => s.roomServiceId.toString() === roomServiceId,
		);

		if (roomServiceIndex === -1) {
			throw new NotFoundException(
				`Room service with ID ${roomServiceId} not found in booking`,
			);
		}

		const roomService = booking.roomServices[roomServiceIndex];
		booking.totalAmount -= roomService.price * roomService.quantity;
		booking.roomServices.splice(roomServiceIndex, 1);

		if (isNaN(booking.totalAmount)) {
			throw new BadRequestException('Total amount calculation resulted in NaN');
		}

		await booking.save();

		return booking;
	}

	async addServicesToBooking(
		bookingId: string,
		servicesWithQuantities: { serviceId: string; quantity: number }[],
	): Promise<Booking> {
		const booking = await this.bookingModel.findById(bookingId).exec();

		if (!booking) {
			throw new NotFoundException(`Booking with ID ${bookingId} not found`);
		}

		const serviceIds = servicesWithQuantities.map((s) => s.serviceId);
		const services = await this.serviceService.findByIds(serviceIds);
		if (services.length !== serviceIds.length) {
			throw new NotFoundException('One or more services not found');
		}

		for (const { serviceId, quantity } of servicesWithQuantities) {
			const service = services.find((s) => s.id === serviceId);
			if (!service) {
				throw new NotFoundException(`Service with ID ${serviceId} not found`);
			}

			const existingService = booking.services.find(
				(s) => s.serviceId.toString() === serviceId,
			);

			if (existingService) {
				existingService.quantity += quantity;
			} else {
				booking.services.push({
					serviceId: new Types.ObjectId(serviceId),
					status: ServiceStatus.Pending,
					price: service.price,
					quantity,
					name: service.serviceName,
				});
			}

			booking.totalAmount += service.price * quantity;
		}

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

		if (filter === 'upcoming') {
			filterConditions.status = BookingStatus.Pending;
		} else if (filter === 'staying') {
			filterConditions.status = BookingStatus.CheckedIn;
		} else if (filter === 'past') {
			filterConditions.status = BookingStatus.CheckedOut;
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

			if (booking.status !== BookingStatus.CheckedIn) {
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

			if (booking.status !== BookingStatus.CheckedIn) {
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

			if (booking.status !== BookingStatus.CheckedIn) {
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

		if (booking.status !== BookingStatus.CheckedIn) {
			throw new BadRequestException('Booking must be in checked in status');
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
