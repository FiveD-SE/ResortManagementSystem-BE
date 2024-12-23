import { BaseEntity } from '@/modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { HydratedDocument } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';

export enum GENDER {
	Male = 'male',
	Female = 'female',
	Other = 'other',
}

export enum UserRole {
	Admin = 'admin',
	User = 'user',
}

export type UserDocument = HydratedDocument<User>;

@Schema({
	toJSON: {
		getters: true,
		virtuals: true,
	},
	timestamps: true,
})
export class User extends BaseEntity {
	@Prop({ required: true, unique: true })
	email: string;

	@Prop({ required: true })
	@Exclude()
	password: string;

	@Prop({ required: true })
	firstName: string;

	@Prop({ required: true })
	lastName: string;

	@Prop({ default: UserRole.User, enum: UserRole, lowercase: true })
	role: string;

	@Prop({ default: null })
	avatar: string;

	@Prop({
		enum: GENDER,
		default: GENDER.Other,
		lowercase: true,
	})
	gender: string;

	@Prop({ default: false, type: Boolean })
	isVerified: boolean;

	@Prop({ default: true, type: Boolean })
	isActive: boolean;

	@Prop()
	@Exclude()
	@ApiHideProperty()
	currentRefreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(paginate);
