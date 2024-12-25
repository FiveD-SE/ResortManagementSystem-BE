import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator';

export class CreateServiceRequestDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(50)
	serviceName?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsNotEmpty()
	@IsString()
	serviceTypeId?: string;

	@IsNotEmpty()
	@IsNumber()
	price?: number;
}
