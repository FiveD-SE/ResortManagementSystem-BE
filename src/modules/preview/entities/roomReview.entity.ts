import { BaseEntity } from '@/modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoomRevieweDocument = HydratedDocument<RoomReview>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
	collection: 'roomReviews',
})
export class RoomReview extends BaseEntity {
	@Prop({ required: true, maxlength: 50 })
	customerId: string;

	@Prop({ required: true, maxlength: 50 })
	roomId: string;

	@Prop({ required: true })
	rating: number;

	@Prop({ required: true, maxlength: 500 })
	comment: string;
}

export const RoomReviewSchema = SchemaFactory.createForClass(RoomReview);
