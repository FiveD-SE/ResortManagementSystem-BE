import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ChangePasswWordRequestDto {
	@IsNotEmpty()
	@IsString()
	oldPassword: string;

	@IsNotEmpty()
	@IsString()
	@IsStrongPassword()
	newPassword: string;
}
