import { BaseEntity } from '@/modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Booking } from '../../booking/entities/booking.entity';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
	collection: 'invoices',
})
export class Invoice extends BaseEntity {
	@Prop({ required: true, type: Types.ObjectId, ref: 'User' })
	userId: Types.ObjectId;

	@Prop({ required: true })
	orderCode: number;

	@Prop({ required: true })
	amount: number;

	@Prop({ required: true })
	description: string;

	@Prop({ required: true })
	returnUrl: string;

	@Prop({ required: true })
	cancelUrl: string;

	@Prop({ required: true })
	status: string;

	@Prop({ required: true })
	issueDate: Date;

	@Prop({ required: true })
	dueDate: Date;

	@Prop({ required: false })
	checkoutUrl: string;

	@Prop({ required: false, type: Types.ObjectId, ref: 'Booking' })
	bookingId: Types.ObjectId;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
