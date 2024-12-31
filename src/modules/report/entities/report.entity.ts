import { BaseEntity } from '@/modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
	collection: 'reports',
})
export class Report extends BaseEntity {
	@Prop({ required: true, maxlength: 50 })
	reportType: string;

	@Prop({ required: true, maxlength: 500 })
	description: string;

	@Prop({ required: true, maxlength: 50 })
	generatedBy: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
