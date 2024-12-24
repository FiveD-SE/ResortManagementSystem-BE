import { BaseEntity } from '@/modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
	collection: 'services',
})
export class Service extends BaseEntity {
	@Prop({ required: true, maxlength: 50, unique: true })
	serviceName: string;

	@Prop({ maxlength: 500 })
	description: string;

	@Prop({ required: true, type: String })
	serviceTypeId: string;

	@Prop({ required: true, type: Number })
	price: number;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
