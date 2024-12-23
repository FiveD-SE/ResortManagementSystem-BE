import { GENDER } from '@/modules/user/entities/user.entity';
import { Transform } from 'class-transformer';
import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsString,
	IsStrongPassword,
} from 'class-validator';

export class RegisterRequestDTO {
	@IsNotEmpty()
	@IsString()
	@IsEmail()
	email: string;

	@IsNotEmpty()
	@IsString()
	@IsStrongPassword()
	password: string;

	@IsNotEmpty()
	@IsString()
	firstName: string;

	@IsNotEmpty()
	@IsString()
	lastName: string;

	@IsNotEmpty()
	@IsEnum(GENDER)
	@IsString()
	@Transform(({ value }) => value.toLowerCase())
	gender: GENDER;
}
