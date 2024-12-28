import {
	Injectable,
	BadRequestException,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';

@Injectable()
export class BookingService {
	constructor(
		@InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
		private readonly roomService: RoomService,
		private readonly serviceService: ServiceService,
		private readonly promotionService: PromotionService,
		private readonly userPromotionService: UserPromotionService,
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
				serviceId: service._id,
				status: ServiceStatus.Pending,
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

	@Roles(UserRole.Admin, UserRole.Receptionist)
	async getBookings(query: PaginateParams): Promise<PaginateData<Booking>> {
		const {
			page = 1,
			limit = 10,
			sortBy = 'createdAt',
			sortOrder = SortOrder.DESC,
		} = query;

		const validSortFields = [
			'createdAt',
			'checkinDate',
			'checkoutDate',
			'totalAmount',
			'status',
		];

		if (sortBy && !validSortFields.includes(sortBy)) {
			throw new BadRequestException(
				`Sort field must be one of: ${validSortFields.join(', ')}`,
			);
		}

		const filter = {};
		const skip = (page - 1) * limit;

		// Fix: Use correct sort type for mongoose
		const sortOptions: { [key: string]: SortOrder } = {
			[sortBy]: sortOrder,
		};

		const [bookings, total] = await Promise.all([
			this.bookingModel
				.find(filter)
				.sort(sortOptions as any) // Type assertion for mongoose compatibility
				.skip(skip)
				.limit(limit)
				.populate('roomId')
				.populate('customerId')
				.populate('services.serviceId')
				.populate('promotionId')
				.exec(),
			this.bookingModel.countDocuments(filter),
		]);

		const totalPages = Math.ceil(total / limit);

		return {
			page,
			limit,
			totalDocs: total,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			totalPages,
			pagingCounter: skip + 1,
			docs: bookings,
		};
	}

	async getBookingById(id: string): Promise<Booking> {
		const booking = await this.bookingModel
			.findById(id)
			.populate('roomId')
			.populate('customerId')
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
}
