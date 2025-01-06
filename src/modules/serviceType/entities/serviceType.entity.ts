import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { BaseEntity } from '@/modules/shared/base/base.entity';

export type ServiceTypeDocument = HydratedDocument<ServiceType>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
	collection: 'serviceTypes',
})
export class ServiceType extends BaseEntity {
	@Prop({ required: true, maxlength: 50, unique: true })
	typeName: string;

	@Prop({ maxlength: 500 })
	description: string;

	@Prop({ type: Types.ObjectId, ref: 'roomType' })
	roomTypeId: Types.ObjectId;
}

export const ServiceTypeSchema = SchemaFactory.createForClass(ServiceType);
