import { BaseEntity } from '@/modules/shared/base/base.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';
import { HydratedDocument, Types } from 'mongoose';
import * as paginate from 'mongoose-paginate-v2';

export enum UserRole {
	Admin = 'admin',
	User = 'user',
	Service_Staff = 'service_staff',
	Receptionist = 'receptionist',
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

	@Prop({ required: false })
	phoneNumber: string;

	@Prop({ default: UserRole.User, enum: UserRole, lowercase: true })
	role: string;

	@Prop({ default: null })
	avatar: string;

	@Prop({ default: false, type: Boolean })
	isVerified: boolean;

	@Prop({ default: true, type: Boolean })
	isActive: boolean;

	@Prop({ type: Types.ObjectId, ref: 'ServiceType' })
	serviceTypeId?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(paginate);
