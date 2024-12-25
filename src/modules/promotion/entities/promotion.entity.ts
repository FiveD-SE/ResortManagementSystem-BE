import { BaseEntity } from '@/modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PromotionDocument = HydratedDocument<Promotion>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
	collection: 'promotions',
})
export class Promotion extends BaseEntity {
	@Prop({ required: true, maxlength: 50 })
	promotionName: string;

	@Prop({ maxlength: 500 })
	description: string;

	@Prop({ required: true, type: Number })
	discount: number;

	@Prop({ required: true, type: Date })
	startDate: Date;

	@Prop({ required: true, type: Date })
	endDate: Date;

	@Prop({ required: true, type: Number })
	quantityPerUser: number;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
