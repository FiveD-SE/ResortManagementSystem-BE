import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	UseGuards,
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

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class InvoiceController {
	constructor(private readonly invoiceService: InvoiceService) {}

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
	): Promise<Invoice> {
		return this.invoiceService.updateInvoiceStatusByOrderCode(
			orderCode,
			status,
		);
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
}
