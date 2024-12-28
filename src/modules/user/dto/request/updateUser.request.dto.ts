import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class UpdateUserRequestDTO {
	@IsString()
	@IsOptional()
	firstName: string;

	@IsString()
	@IsOptional()
	lastName: string;

	@IsEnum(UserRole)
	@IsOptional()
	role: string;

	@IsOptional()
	@IsBoolean()
	isVerified: boolean;

	@IsOptional()
	@IsBoolean()
	isActive: boolean;

	@IsOptional()
	@IsString()
	serviceTypeId: string;
}
