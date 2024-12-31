import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from '../invoice/entities/invoice.entity';
import { User, UserSchema } from '../user/entities/user.entity';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { Booking, BookingSchema } from '../booking/entities/booking.entity';
import { Room, RoomSchema } from '../room/entities/room.entity';
import { RoomType, RoomTypeSchema } from '../roomType/entities/roomType.entity';
import { Service, ServiceSchema } from '../service/entities/service.entity';
import { RoomModule } from '../room/room.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }]),
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
		MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
		MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
		MongooseModule.forFeature([
			{ name: RoomType.name, schema: RoomTypeSchema },
		]),
		MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
		RoomModule,
	],
	controllers: [AdminDashboardController],
	providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
