import {
	Controller,
	Get,
	Post,
	Patch,
	Param,
	Body,
	UseGuards,
} from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/createInvoice.dto';
import { UpdateInvoiceStatusDto } from './dto/updateInvoiceStatus.dto';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { Invoice } from './entities/invoice.entity';

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

	// @Get(':id')
	// @ApiOperation({ summary: 'Get an invoice by ID' })
	// @ApiResponse({
	// 	status: 200,
	// 	description: 'The invoice has been successfully retrieved.',
	// 	type: Invoice,
	// })
	// @ApiResponse({ status: 404, description: 'Invoice not found' })
	// async getInvoiceById(@Param('id') id: string) {
	// 	return this.invoiceService.getInvoiceById(id);
	// }

	// @Patch(':id/status')
	// @Roles(UserRole.Admin)
	// @ApiOperation({ summary: 'Update the status of an invoice' })
	// @ApiResponse({
	// 	status: 200,
	// 	description: 'The invoice status has been successfully updated.',
	// 	type: Invoice,
	// })
	// @ApiResponse({ status: 404, description: 'Invoice not found' })
	// async updateInvoiceStatus(
	// 	@Param('id') id: string,
	// 	@Body() updateInvoiceStatusDto: UpdateInvoiceStatusDto,
	// ) {
	// 	return this.invoiceService.updateInvoiceStatus(id, updateInvoiceStatusDto);
	// }

	// @Post('process-all')
	// @Roles(UserRole.Admin)
	// @ApiOperation({ summary: 'Process all invoices' })
	// @ApiResponse({
	// 	status: 200,
	// 	description: 'All invoices have been successfully processed.',
	// })
	// async processAllInvoices() {
	// 	return this.invoiceService.processAllInvoices();
	// }
}
