import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class UpdateServiceRequestDto {
	@IsOptional()
	@IsString()
	@MaxLength(50)
	serviceName?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsOptional()
	@IsString()
	serviceTypeId?: string;

	@IsOptional()
	@IsNumber()
	price?: number;
}
