import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { BaseEntity } from '@/modules/shared/base/base.entity';

export enum TokenType {
	RefreshToken = 'refreshToken',
	ResetPassword = 'resetPassword',
}

export type TokenDocument = HydratedDocument<Token>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
})
export class Token extends BaseEntity {
	@Prop({ required: true, enum: TokenType })
	type: TokenType;

	@Prop({ required: true })
	token: string;

	@Prop({ required: true })
	userId: string;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
