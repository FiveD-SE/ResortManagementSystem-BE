import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateServiceTypeRequestDto {
	@IsOptional()
	@IsString()
	@MaxLength(50)
	typeName?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsOptional()
	@IsString()
	roomTypeId?: string;
}
