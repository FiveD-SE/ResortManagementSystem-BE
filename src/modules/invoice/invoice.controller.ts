import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	UseGuards,
	Req,
	BadRequestException,
	Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/createInvoice.dto';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { Invoice } from './entities/invoice.entity';
import { Public } from '@/decorators/auth.decorator';
import { RequestWithUser } from '@/types/request.type';
import { BookingService } from '../booking/booking.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class InvoiceController {
	constructor(
		private readonly invoiceService: InvoiceService,
		private readonly bookingService: BookingService,
		private readonly conf: ConfigService,
	) {}

	@Post()
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Create a new invoice' })
	@ApiResponse({
		status: 201,
		description: 'The invoice has been successfully created.',
		type: Invoice,
	})
	@ApiResponse({ status: 400, description: 'Bad Request' })
	async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
		return this.invoiceService.createInvoice(createInvoiceDto);
	}

	@Get('update-invoice-status')
	@Public()
	@ApiOperation({ summary: 'Update invoice status by order code' })
	@ApiResponse({
		status: 200,
		description: 'The invoice status has been successfully updated.',
		type: Invoice,
	})
	@ApiResponse({ status: 404, description: 'Invoice not found' })
	async updateInvoiceStatus(
		@Query('orderCode') orderCode: number,
		@Query('status') status: string,
		@Res() res: Response,
	): Promise<void> {
		const invoice = await this.invoiceService.updateInvoiceStatusByOrderCode(
			orderCode,
			status,
		);

		if (!invoice) {
			throw new BadRequestException('Invoice not found');
		}

		const frontendUrl =
			this.conf.get('FRONTEND_URL') + '/trips/detail/' + invoice.bookingId;
		res.redirect(frontendUrl);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get an invoice by ID' })
	@ApiResponse({
		status: 200,
		description: 'The invoice has been successfully retrieved.',
		type: Invoice,
	})
	@ApiResponse({ status: 404, description: 'Invoice not found' })
	async getInvoiceById(@Param('id') id: string): Promise<Invoice> {
		return this.invoiceService.getInvoiceById(id);
	}

	@Get('booking/:bookingId')
	@Roles(UserRole.Admin, UserRole.Receptionist, UserRole.User)
	@ApiOperation({ summary: 'Get all invoices for a booking' })
	@ApiResponse({
		status: 200,
		description: 'List of invoices for the booking',
		type: [Invoice],
	})
	@ApiResponse({ status: 400, description: 'Invalid booking ID format' })
	@ApiResponse({ status: 404, description: 'Booking not found' })
	async getInvoicesByBookingId(
		@Param('bookingId') bookingId: string,
		@Req() req: RequestWithUser,
	): Promise<Invoice[]> {
		if (req.user.role === UserRole.User) {
			const booking = await this.bookingService.findBookingById(bookingId);
			console.log('Booking:', booking);
			console.log('User:', req.user);
			if (booking.customerId._id.toString() !== req.user._id.toString()) {
				throw new BadRequestException(
					'You are not authorized to view these invoices',
				);
			}
		}

		return this.invoiceService.findByBookingId(bookingId);
	}
}
