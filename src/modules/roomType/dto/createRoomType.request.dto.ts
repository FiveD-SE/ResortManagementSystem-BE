import {
	IsNumber,
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
	IsArray,
	ArrayNotEmpty,
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

	@IsNotEmpty()
	@IsNumber()
	bedAmount: number;

	@IsNotEmpty()
	@IsNumber()
	bedroomAmount: number;

	@IsNotEmpty()
	@IsNumber()
	sharedBathAmount: number;

	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	amenities?: string[];

	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	keyFeatures?: string[];
}
