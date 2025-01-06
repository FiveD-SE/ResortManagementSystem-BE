import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseEntity } from '@/modules/shared/base/base.entity';

export type RoomServiceDocument = HydratedDocument<RoomService>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
	collection: 'roomServices',
})
export class RoomService extends BaseEntity {
	@Prop({ required: true, maxlength: 50, unique: true })
	serviceName: string;

	@Prop({ maxlength: 500 })
	description: string;

	@Prop({ required: true, type: Number })
	price: number;
}

export const RoomServiceSchema = SchemaFactory.createForClass(RoomService);
