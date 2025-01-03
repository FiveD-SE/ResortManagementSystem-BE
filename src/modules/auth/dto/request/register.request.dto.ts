import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
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

	@IsOptional()
	phoneNumber: string;
}
