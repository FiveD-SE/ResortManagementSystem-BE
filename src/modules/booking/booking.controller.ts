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

@Controller('bookings')
@UseGuards(JwtAccessTokenGuard)
export class BookingController {
	constructor(private readonly bookingService: BookingService) {}

	@Post(':roomId')
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
	): Promise<PaginateData<Booking>> {
		return this.bookingService.getBookings(query);
	}

	@Get(':id')
	@Roles(UserRole.Admin, UserRole.Receptionist)
	@ApiOperation({ summary: 'Get booking by ID' })
	async getBookingById(@Param('id') id: string): Promise<Booking> {
		return this.bookingService.getBookingById(id);
	}

	@Patch(':id/checkin')
	@Roles(UserRole.Admin, UserRole.Receptionist)
	@ApiOperation({ summary: 'Check in a booking (Admin/Receptionist only)' })
	async checkIn(@Param('id') id: string): Promise<Booking> {
		return this.bookingService.checkIn(id);
	}
}
