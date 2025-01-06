import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateServiceTypeRequestDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(50)
	typeName?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsNotEmpty()
	@IsString()
	roomTypeId?: string;
}
