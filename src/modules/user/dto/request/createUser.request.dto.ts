import {
	IsString,
	IsEmail,
	IsEnum,
	IsOptional,
	MinLength,
} from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class CreateUserRequestDTO {
	@IsString()
	firstName: string;

	@IsString()
	lastName: string;

	@IsEmail()
	email: string;

	@IsString()
	@MinLength(6)
	password: string;

	@IsEnum(UserRole)
	@IsOptional()
	role?: UserRole;
}
