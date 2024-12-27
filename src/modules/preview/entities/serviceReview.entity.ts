import { BaseEntity } from '@/modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceReviewDocument = HydratedDocument<ServiceReview>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
	collection: 'serviceReviews',
})
export class ServiceReview extends BaseEntity {
	@Prop({ required: true, maxlength: 50 })
	customerId: string;

	@Prop({ required: true, maxlength: 50 })
	serviceId: string;

	@Prop({ required: true })
	rating: number;
}

export const ServiceReviewSchema = SchemaFactory.createForClass(ServiceReview);
