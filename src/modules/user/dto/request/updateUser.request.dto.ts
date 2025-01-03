import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/user.entity';

export class UpdateUserRequestDTO {
	@ApiProperty({
		description: 'The first name of the user',
		example: 'John',
		required: false,
	})
	@IsString()
	@IsOptional()
	firstName: string;

	@ApiProperty({
		description: 'The last name of the user',
		example: 'Doe',
		required: false,
	})
	@IsString()
	@IsOptional()
	lastName: string;

	@ApiProperty({
		description: 'Role of the user',
		example: UserRole.Admin,
		enum: UserRole,
		required: false,
	})
	@IsEnum(UserRole)
	@IsOptional()
	role: string;

	@ApiProperty({
		description: 'Indicates whether the user is verified',
		example: true,
		required: false,
	})
	@IsOptional()
	@IsBoolean()
	isVerified: boolean;

	@ApiProperty({
		description: 'Indicates whether the user is active',
		example: true,
		required: false,
	})
	@IsOptional()
	@IsBoolean()
	isActive: boolean;

	@ApiProperty({
		description: 'The service type ID associated with the user',
		example: 'service-type-id-123',
		required: false,
	})
	@IsOptional()
	@IsString()
	serviceTypeId: string;

	@ApiProperty({
		description: 'Phone number of the user',
		example: '1234567890',
		required: false,
	})
	@IsOptional()
	@IsString()
	phoneNumber: string;
}
