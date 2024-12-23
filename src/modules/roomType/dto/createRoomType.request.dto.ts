import {
	IsNumber,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator';

export class CreateRoomTypeDTO {
	@IsNotEmpty()
	@IsString()
	@MaxLength(50)
	typeName: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsNotEmpty()
	@IsNumber()
	basePrice: number;

	@IsNotEmpty()
	@IsNumber()
	guestAmount: number;
}
