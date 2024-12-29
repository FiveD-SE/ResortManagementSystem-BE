import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendEmailDto {
	@IsNotEmpty()
	@IsEmail()
	to: string;

	@IsNotEmpty()
	@IsString()
	subject: string;

	@IsNotEmpty()
	@IsString()
	html: string;
}
