import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking, BookingSchema } from './entities/booking.entity';
import { RoomModule } from '../room/room.module';
import { ServiceModule } from '../service/service.module';
import { PromotionModule } from '../promotion/promotion.module';
import { InvoiceModule } from '../invoice/invoice.module';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../user/user.module';
import { ServiceTypeModule } from '../serviceType/serviceType.module';
import { RoomTypeModule } from '../roomType/roomType.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
		forwardRef(() => RoomModule),
		ServiceModule,
		PromotionModule,
		InvoiceModule,
		EmailModule,
		UserModule,
		ServiceTypeModule,
		RoomTypeModule,
	],
	controllers: [BookingController],
	providers: [BookingService],
	exports: [
		BookingService,
		MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
	],
})
export class BookingModule {}
