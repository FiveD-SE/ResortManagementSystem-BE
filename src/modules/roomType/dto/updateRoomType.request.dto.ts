import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRoomTypeDTO {
	@IsOptional()
	@IsString()
	@MaxLength(50)
	typeName?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsOptional()
	@IsNumber()
	basePrice?: number;

	@IsOptional()
	@IsNumber()
	guestAmount?: number;
}
