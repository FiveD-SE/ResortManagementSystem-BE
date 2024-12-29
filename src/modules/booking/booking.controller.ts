import {
	Controller,
	Post,
	Body,
	Param,
	UseGuards,
	Req,
	Get,
	Query,
	Patch,
	BadRequestException,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDTO } from './dto/createBooking.dto';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { Booking } from './entities/booking.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Invoice } from '../invoice/entities/invoice.entity';
import { RequestWithUser } from '@/types/request.type';

@Controller('bookings')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class BookingController {
	constructor(private readonly bookingService: BookingService) {}

	@Post(':roomId')
	@Roles(UserRole.User)
	@ApiOperation({ summary: 'Create a new booking' })
	@ApiResponse({ status: 201, description: 'Booking created successfully' })
	async createBooking(
		@Param('roomId') roomId: string,
		@Req() req,
		@Body() createBookingDto: CreateBookingDTO,
	) {
		return this.bookingService.createBooking(
			roomId,
			req.user.id,
			createBookingDto,
		);
	}

	@Get()
	@Roles(UserRole.Admin, UserRole.Receptionist)
	@ApiOperation({ summary: 'Get all bookings' })
	@ApiPaginationQuery()
	@ApiQuery({
		name: 'filter',
		required: false,
		enum: ['pending', 'checked in', 'checked out'],
		description: 'Filter for bookings (pending, checked in, checked out)',
	})
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['createdAt', 'checkinDate', 'checkoutDate', 'totalAmount', 'status'],
		description: 'Field to sort by',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: SortOrder,
		description: 'Sort order (asc/desc)',
	})
	async getBookings(
		@Query() query: PaginateParams,
		@Query('filter')
		filter?: 'pending' | 'checked in' | 'checked out',
	): Promise<PaginateData<Booking>> {
		return this.bookingService.getBookings(query, filter);
	}

	@Get('status-count')
	@Roles(UserRole.Admin, UserRole.Receptionist)
	@ApiOperation({ summary: 'Get count of bookings by status' })
	@ApiResponse({
		status: 200,
		description: 'Count of bookings by status',
		schema: {
			type: 'object',
			properties: {
				pending: { type: 'number' },
				checkedIn: { type: 'number' },
				checkedOut: { type: 'number' },
			},
		},
	})
	async getBookingCountByStatus(): Promise<{
		pending: number;
		checkedIn: number;
		checkedOut: number;
	}> {
		return this.bookingService.getBookingCountByStatus();
	}

	@Get(':id')
	@Roles(UserRole.Admin, UserRole.Receptionist, UserRole.User)
	@ApiOperation({ summary: 'Get booking by ID' })
	async getBookingById(
		@Param('id') id: string,
		@Req() req: RequestWithUser,
	): Promise<Booking> {
		const booking = await this.bookingService.getBookingById(id);
		if (
			req.user.role === UserRole.User &&
			booking.customerId._id.toString() !== req.user.id
		) {
			throw new BadRequestException(
				'You are not authorized to view this booking',
			);
		}
		return booking;
	}

	@Patch(':id/checkin')
	@Roles(UserRole.Admin, UserRole.Receptionist)
	@ApiOperation({ summary: 'Check in a booking (Admin/Receptionist only)' })
	async checkIn(@Param('id') id: string): Promise<Booking> {
		return this.bookingService.checkIn(id);
	}

	@Post(':id/checkout')
	@Roles(UserRole.Admin, UserRole.Receptionist)
	@ApiOperation({ summary: 'Checkout a booking and create an invoice' })
	async checkoutBooking(@Param('id') id: string): Promise<Invoice> {
		return this.bookingService.checkoutBooking(id);
	}

	@Post(':bookingId/services/:serviceId')
	@Roles(UserRole.Admin, UserRole.Receptionist, UserRole.User)
	@ApiOperation({ summary: 'Add a service to a booking' })
	async addServiceToBooking(
		@Param('bookingId') bookingId: string,
		@Param('serviceId') serviceId: string,
		@Req() req: RequestWithUser,
	): Promise<Booking> {
		const userId = req.user._id.toString();
		const booking = await this.bookingService.getBookingById(bookingId);

		if (booking.customerId._id.toString() !== userId) {
			throw new BadRequestException(
				'You are not authorized to add services to this booking',
			);
		}

		return this.bookingService.addServiceToBooking(bookingId, serviceId);
	}

	@Get('user/:userId')
	@Roles(UserRole.Admin, UserRole.Receptionist, UserRole.User)
	@ApiOperation({ summary: 'Get bookings by user ID with optional filters' })
	@ApiPaginationQuery()
	@ApiQuery({
		name: 'filter',
		required: false,
		enum: ['upcoming', 'staying', 'past'],
		description: 'Filter for bookings (upcoming, staying, past)',
	})
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['createdAt', 'checkinDate', 'checkoutDate', 'totalAmount', 'status'],
		description: 'Field to sort by',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: SortOrder,
		description: 'Sort order (asc/desc)',
	})
	async getBookingsByUserId(
		@Param('userId') userId: string,
		@Query() query: PaginateParams,
		@Query('filter') filter?: 'upcoming' | 'staying' | 'past',
	): Promise<PaginateData<Booking>> {
		return this.bookingService.getBookingsByUserId(userId, query, filter);
	}
}
