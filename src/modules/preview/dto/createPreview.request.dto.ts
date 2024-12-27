import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
} from 'class-validator';

export class CreateReviewRequestDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(50)
	customerId: string;

	@IsNotEmpty()
	@IsString()
	@MaxLength(500)
	roomId: string;

	@IsNotEmpty()
	@IsNumber()
	rating: number;

	@IsNotEmpty()
	@IsString()
	@MaxLength(500)
	comment: string;

	@IsOptional()
	services: { serviceId: string; rating: number }[];
}
