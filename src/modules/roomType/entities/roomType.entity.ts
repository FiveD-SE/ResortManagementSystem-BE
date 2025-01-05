import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseEntity } from '@/modules/shared/base/base.entity';

export type RoomTypeDocument = HydratedDocument<RoomType>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
})
export class RoomType extends BaseEntity {
	@Prop({ required: true, maxlength: 50 })
	typeName: string;

	@Prop({ maxlength: 500 })
	description: string;

	@Prop({ required: true, type: Number })
	basePrice: number;

	@Prop({ required: true, type: Number })
	guestAmount: number;

	@Prop({ required: true, type: Number })
	bedAmount: number;

	@Prop({ required: true, type: Number })
	bedroomAmount: number;

	@Prop({ required: true, type: Number })
	sharedBathAmount: number;

	@Prop({ type: [String], default: [] })
	amenities: string[];

	@Prop({ type: [String], default: [] })
	keyFeatures: string[];
}

export const RoomTypeSchema = SchemaFactory.createForClass(RoomType);
