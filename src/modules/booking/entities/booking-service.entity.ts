import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ServiceStatus } from '../../service/enums/service-status.enum';

@Schema()
export class BookingService {
	@Prop({ type: Types.ObjectId, ref: 'Service', required: true })
	serviceId: Types.ObjectId;

	@Prop({ required: true, enum: ServiceStatus, default: ServiceStatus.Pending })
	status: ServiceStatus;
}

export const BookingServiceSchema =
	SchemaFactory.createForClass(BookingService);