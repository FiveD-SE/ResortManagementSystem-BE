import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { BaseEntity } from '@/modules/shared/base/base.entity';

export type BookingRoomServiceDocument = HydratedDocument<BookingRoomService>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
})
export class BookingRoomService extends BaseEntity {
	@Prop({ required: true, type: Types.ObjectId, ref: 'RoomService' })
	roomServiceId: Types.ObjectId;

	@Prop({ required: true })
	quantity: number;

	@Prop({ required: true })
	price: number;

	@Prop({ required: true })
	name: string;
}

export const BookingRoomServiceSchema =
	SchemaFactory.createForClass(BookingRoomService);
