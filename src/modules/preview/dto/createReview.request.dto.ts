import { Type } from 'class-transformer';
import {
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	MaxLength,
	ValidateNested,
} from 'class-validator';
import { CreateServiceReviewRequestDto } from './createServiceReview.request.dto';

export class CreateReviewRequestDto {
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
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateServiceReviewRequestDto)
	services?: CreateServiceReviewRequestDto[];
}
