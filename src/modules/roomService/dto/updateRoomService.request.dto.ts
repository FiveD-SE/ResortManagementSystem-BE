import { IsString, IsOptional, IsNumber, MaxLength } from 'class-validator';

export class UpdateRoomServiceRequestDto {
	@IsOptional()
	@IsString()
	@MaxLength(50)
	serviceName?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsOptional()
	@IsNumber()
	price?: number;
}
