import {
	IsNotEmpty,
	IsOptional,
	IsString,
	MaxLength,
	IsNumber,
	IsDate,
} from 'class-validator';

export class CreatePromotionRequestDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(50)
	promotionName?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsNotEmpty()
	@IsNumber()
	discount?: number;

	@IsNotEmpty()
	@IsNumber()
	quantityPerUser?: number;

	@IsNotEmpty()
	@IsDate()
	startDate?: Date;

	@IsNotEmpty()
	@IsDate()
	endDate?: Date;
}
