import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { Invoice, InvoiceSchema } from './entities/invoice.entity';
import { BookingModule } from '../booking/booking.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
		forwardRef(() => BookingModule),
	],
	controllers: [InvoiceController],
	providers: [InvoiceService],
	exports: [InvoiceService],
})
export class InvoiceModule {}
