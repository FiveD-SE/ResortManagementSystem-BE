import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { AdminDashboardService } from './admin-dashboard.service';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RoomService } from '../room/room.service';

@ApiTags('Admin Dashboard')
@Controller('admin-dashboard')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class AdminDashboardController {
	constructor(
		private readonly adminDashboardService: AdminDashboardService,
		private readonly roomService: RoomService,
	) {}

	@Get('daily-revenue')
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Get daily revenue and growth percentage' })
	@ApiResponse({
		status: 200,
		description: 'Daily revenue and growth percentage',
		schema: {
			type: 'object',
			properties: {
				revenue: { type: 'number' },
				growth: { type: 'number' },
			},
		},
	})
	async getDailyRevenue() {
		return this.adminDashboardService.getDailyRevenue();
	}

	@Get('yearly-revenue')
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Get yearly revenue' })
	@ApiResponse({
		status: 200,
		description: 'Yearly revenue',
		schema: {
			type: 'object',
			properties: {
				currentYearRevenue: { type: 'number' },
				lastYearRevenue: { type: 'number' },
				currentYearMonthlyRevenue: {
					type: 'array',
					items: { type: 'number' },
				},
				lastYearMonthlyRevenue: {
					type: 'array',
					items: { type: 'number' },
				},
				growth: { type: 'number' },
			},
		},
	})
	async getYearlyRevenue() {
		return this.adminDashboardService.getYearlyRevenue();
	}

	@Get('daily-customer-growth')
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Get daily customer growth percentage' })
	@ApiResponse({
		status: 200,
		description: 'Daily customer growth percentage',
		schema: {
			type: 'object',
			properties: {
				customers: { type: 'number' },
				growth: { type: 'number' },
			},
		},
	})
	async getDailyCustomerGrowth() {
		return this.adminDashboardService.getDailyCustomerGrowth();
	}

	@Get('revenue-by-service')
	async getRevenueByService() {
		return this.adminDashboardService.getRevenueByServiceForLast5Years();
	}

	@Get('revenue-by-room-type')
	@Roles(UserRole.Admin)
	@ApiOperation({
		summary:
			'Get revenue by room type for the current year or specified date range',
	})
	@ApiQuery({
		name: 'start',
		required: false,
		type: Date,
		description: 'Start date for the revenue calculation',
	})
	@ApiQuery({
		name: 'end',
		required: false,
		type: Date,
		description: 'End date for the revenue calculation',
	})
	@ApiResponse({
		status: 200,
		description:
			'Revenue by room type for the specified date range or current year',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					roomType: { type: 'string' },
					revenue: { type: 'number' },
				},
			},
		},
	})
	async getRevenueByRoomType(
		@Query('start') start?: Date,
		@Query('end') end?: Date,
	) {
		const currentYear = new Date().getFullYear();
		const dateRange = {
			start: start || new Date(currentYear, 0, 1),
			end: end || new Date(currentYear, 11, 31),
		};
		return this.adminDashboardService.getRevenueByRoomType(dateRange);
	}

	@Get('room-availability-today')
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Get room availability for today' })
	@ApiResponse({
		status: 200,
		description: 'Room availability for today',
		schema: {
			type: 'object',
			properties: {
				availableRooms: { type: 'number' },
				bookedRooms: { type: 'number' },
				totalRooms: { type: 'number' },
			},
		},
	})
	async getRoomAvailabilityToday(): Promise<{
		availableRooms: number;
		bookedRooms: number;
		totalRooms: number;
	}> {
		return this.roomService.getRoomAvailabilityToday();
	}

	@Get('export-excel')
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Export data to Excel' })
	@ApiResponse({
		status: 200,
		description: 'The data has been successfully exported to Excel.',
	})
	@ApiQuery({
		name: 'startDate',
		required: false,
		type: String,
		description: 'Start date of the range',
		format: 'date',
	})
	@ApiQuery({
		name: 'endDate',
		required: false,
		type: String,
		description: 'End date of the range',
		format: 'date',
	})
	async exportToExcel(
		@Query('startDate') startDate: string,
		@Query('endDate') endDate: string,
		@Res() res: Response,
	) {
		return this.adminDashboardService.exportToExcel(startDate, endDate, res);
	}

	@Get('export-customer-excel')
	@Roles(UserRole.Admin)
	@ApiOperation({
		summary: 'Export customer to Excel',
	})
	async exportUsersToExcel(@Res() res: Response) {
		return this.adminDashboardService.exportUsersToExcel(res);
	}

	@Get('export-staff-excel')
	@Roles(UserRole.Admin)
	@ApiOperation({
		summary: 'Export users to Excel',
	})
	async exportStaffsToExcel(@Res() res: Response) {
		return this.adminDashboardService.exportStaffToExcel(res);
	}

	@Get('export-room-excel')
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Export rooms to Excel' })
	async exportRoomsToExcel(@Res() res: Response) {
		return this.adminDashboardService.exportRoomsToExcel(res);
	}

	@Get('export-service-excel')
	@Roles(UserRole.Admin)
	@ApiOperation({
		summary: 'Export services to excel',
	})
	async exportServicesToExcel(@Res() res: Response) {
		return this.adminDashboardService.exportServicesToExcel(res);
	}

	@Get('export-promotion-excel')
	@Roles(UserRole.Admin)
	@ApiOperation({
		summary: 'Export promotions to Excel',
	})
	async exportPromotionsToExcel(@Res() res: Response) {
		return this.adminDashboardService.exportPromotionsToExcel(res);
	}

	@Get('export-booking-excel')
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Export bookings to Excel' })
	async exportBookingsToExcel(@Res() res: Response) {
		return this.adminDashboardService.exportBookingToExcel(res);
	}

	@Get('room-count-by-room-type')
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Get room count by room type' })
	@ApiResponse({
		status: 200,
		description: 'Room count by room type',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					roomType: { type: 'string' },
					count: { type: 'number' },
				},
			},
		},
	})
	async getRoomCountByRoomType() {
		return this.adminDashboardService.getRoomCountByRoomType();
	}

	@Get('service-count-by-service-type')
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Get service count by service type' })
	@ApiResponse({
		status: 200,
		description: 'Service count by service type',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					serviceType: { type: 'string' },
					count: { type: 'number' },
				},
			},
		},
	})
	async getServiceCountByServiceType() {
		return this.adminDashboardService.getServiceCountByServiceType();
	}
}
