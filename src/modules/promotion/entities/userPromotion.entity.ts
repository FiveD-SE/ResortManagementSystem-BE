import { BaseEntity } from '@/modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserPromotionDocument = HydratedDocument<UserPromotion>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
	collection: 'userPromotions',
})
export class UserPromotion extends BaseEntity {
	@Prop({ required: true, unique: true, type: String })
	userId: string;

	@Prop({
		type: [
			{
				promotionId: { type: String, required: true },
				promotionName: { type: String, required: true },
				description: { type: String },
				discount: { type: Number, required: true },
				startDate: { type: Date, required: true },
				endDate: { type: Date, required: true },
				quantity: { type: Number, required: true },
			},
		],
		default: [],
	})
	promotions: {
		promotionId: string;
		promotionName: string;
		description?: string;
		discount: number;
		startDate: Date;
		endDate: Date;
		quantity: number;
	}[];
}

export const UserPromotionSchema = SchemaFactory.createForClass(UserPromotion);
