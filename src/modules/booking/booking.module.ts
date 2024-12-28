import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking, BookingSchema } from './entities/booking.entity';
import { RoomModule } from '../room/room.module';
import { ServiceModule } from '../service/service.module';
import { PromotionModule } from '../promotion/promotion.module';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
		RoomModule,
		ServiceModule,
		PromotionModule,
		InvoiceModule,
	],
	controllers: [BookingController],
	providers: [BookingService],
	exports: [BookingService],
})
export class BookingModule {}
