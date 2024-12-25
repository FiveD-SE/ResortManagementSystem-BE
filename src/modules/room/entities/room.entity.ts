import { BaseEntity } from '@/modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoomDocument = HydratedDocument<Room>;

export enum RoomStatus {
	Available = 'Available',
	Occupied = 'Occupied',
	UnderMaintenance = 'Under Maintenance',
}

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
})
export class Room extends BaseEntity {
	@Prop({ required: true, maxlength: 5 })
	roomNumber: string;

	@Prop({ required: true })
	roomTypeId: string;

	@Prop({ required: true, enum: RoomStatus })
	status: RoomStatus;

	@Prop({ required: true, type: Number })
	pricePerNight: number;

	@Prop({ type: [String], default: [] })
	images: string[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
