import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class CreateServiceReviewRequestDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(500)
	serviceId: string;

	@IsNotEmpty()
	@IsNumber()
	rating: number;
}
