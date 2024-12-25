import {
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	IsArray,
	ArrayNotEmpty,
} from 'class-validator';

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

	@IsOptional()
	@IsNumber()
	bedAmount?: number;

	@IsOptional()
	@IsNumber()
	bedroomAmount?: number;

	@IsOptional()
	@IsNumber()
	sharedBathAmount?: number;

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
