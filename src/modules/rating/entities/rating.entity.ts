import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RatingDocument = Rating & Document;

@Schema({ timestamps: true })
export class Rating {
	@Prop({ required: true, type: Types.ObjectId, ref: 'User' })
	userId: Types.ObjectId;

	@Prop({ required: true, min: 1, max: 5 })
	cleanliness: number;

	@Prop({ required: true, min: 1, max: 5 })
	accuracy: number;

	@Prop({ required: true, min: 1, max: 5 })
	checkIn: number;

	@Prop({ required: true, min: 1, max: 5 })
	communication: number;

	@Prop({ required: true, min: 1, max: 5 })
	location: number;

	@Prop({ required: true, min: 1, max: 5 })
	value: number;

	@Prop()
	comment?: string;

	@Prop({ required: true })
	roomId: Types.ObjectId;

	@Prop({ required: true, default: 0 })
	average: number;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

RatingSchema.pre('save', async function (next) {
	const total =
		this.cleanliness +
		this.accuracy +
		this.checkIn +
		this.communication +
		this.location +
		this.value;
	this.average = parseFloat((total / 6).toFixed(2));
	next();
});
