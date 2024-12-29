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
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { Room } from '../room/entities/room.entity';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { CreateInvoiceDto } from '../invoice/dto/createInvoice.dto';
import { Invoice } from '../invoice/entities/invoice.entity';
import { InvoiceService } from '../invoice/invoice.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';

@Injectable()
export class BookingService {
	constructor(
		@InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
		private readonly roomService: RoomService,
		private readonly serviceService: ServiceService,
		private readonly promotionService: PromotionService,
		private readonly userPromotionService: UserPromotionService,
		private readonly invoiceService: InvoiceService,
		private readonly configService: ConfigService,
		private readonly emailService: EmailService,
		private readonly userService: UserService,
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

		let totalAmount = room.pricePerNight;

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
						select: 'typeName', // Select only the typeName field
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
					select: 'typeName', // Select only the typeName field
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

		const items = [
			{
				name: room.roomNumber,
				quantity: 1,
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
}
