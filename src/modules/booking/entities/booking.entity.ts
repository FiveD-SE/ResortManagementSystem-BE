import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseEntity } from '@/modules/shared/base/base.entity';
import { BookingService, BookingServiceSchema } from './booking-service.entity';

export type BookingDocument = HydratedDocument<Booking>;

export enum BookingStatus {
	Pending = 'Pending',
	CheckedIn = 'Checked in',
	CheckedOut = 'Checked out',
	Cancelled = 'Cancelled',
}

@Schema({
	timestamps: true,
	toJSON: {
		virtuals: true,
		getters: true,
	},
})
export class Booking extends BaseEntity {
	@Prop({ required: true, type: Types.ObjectId, ref: 'Room' })
	roomId: Types.ObjectId;

	@Prop({ required: true, type: Types.ObjectId, ref: 'User' })
	customerId: Types.ObjectId;

	@Prop({ required: true })
	checkinDate: Date;

	@Prop({ required: true })
	checkoutDate: Date;

	@Prop({ required: true, enum: BookingStatus, default: BookingStatus.Pending })
	status: BookingStatus;

	@Prop({ type: [BookingServiceSchema] })
	services: BookingService[];

	@Prop({ type: Types.ObjectId, ref: 'Promotion' })
	promotionId: Types.ObjectId;

	@Prop({ required: true, type: Number })
	totalAmount: number;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
