import {
	IsBoolean,
	IsDate,
	IsEnum,
	IsOptional,
	IsString,
} from 'class-validator';
import { GENDER, UserRole } from '../../entities/user.entity';

export class UpdateUserRequestDTO {
	@IsString()
	@IsOptional()
	firstName: string;

	@IsString()
	@IsOptional()
	lastName: string;

	@IsEnum(GENDER)
	@IsOptional()
	gender: string;

	@IsEnum(UserRole)
	@IsOptional()
	role: string;

	@IsOptional()
	@IsBoolean()
	isVerified: boolean;

	@IsOptional()
	@IsBoolean()
	isActive: boolean;
}
