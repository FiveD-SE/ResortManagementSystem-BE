import {
	BadRequestException,
	HttpStatus,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { Invoice, InvoiceDocument } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/createInvoice.dto';
import { UpdateInvoiceStatusDto } from './dto/updateInvoiceStatus.dto';
import { payOS } from '@/configs/payOS.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

const MAX_SAFE_INTEGER = 9007199254740991;
const MAX_ORDER_CODE = Math.floor(MAX_SAFE_INTEGER / 10);

const generateOrderCode = () => {
	return Math.floor(Math.random() * MAX_ORDER_CODE) + 1;
};

@Injectable()
export class InvoiceService {
	constructor(
		@InjectModel(Invoice.name)
		private readonly invoiceModel: Model<InvoiceDocument>,
	) {}

	async createInvoice(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
		const { amount, description, returnUrl, cancelUrl, userId, items } =
			createInvoiceDto;

		if (amount <= 0) {
			throw {
				status: HttpStatus.BAD_REQUEST,
				message: 'Amount must be greater than 0',
			};
		}

		const newInvoice = new this.invoiceModel({
			orderCode: generateOrderCode(),
			amount,
			description,
			returnUrl,
			cancelUrl,
			userId,
			status: 'PENDING',
			issueDate: new Date(),
			dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
			items,
		});

		await newInvoice.save();

		const paymentLinkParams = {
			orderCode: newInvoice.orderCode,
			amount: newInvoice.amount,
			description: newInvoice.description,
			returnUrl: newInvoice.returnUrl,
			cancelUrl: newInvoice.cancelUrl,
			items: createInvoiceDto.items,
		};

		console.log('Payment Link Params:', paymentLinkParams);

		try {
			const paymentLinkResponse =
				await payOS.createPaymentLink(paymentLinkParams);
			newInvoice.checkoutUrl = paymentLinkResponse.checkoutUrl;
			await newInvoice.save();
			console.log('Payment Link Response:', paymentLinkResponse);
			return newInvoice;
		} catch (error) {
			console.error('Error creating payment link:', error);
			throw new BadRequestException('Failed to create payment link');
		}
	}
}