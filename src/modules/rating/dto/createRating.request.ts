import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRatingDTO {
	@ApiProperty({
		description: 'Rating for cleanliness',
		example: 5,
		minimum: 1,
		maximum: 5,
	})
	@IsNumber()
	@Min(1)
	@Max(5)
	cleanliness: number;

	@ApiProperty({
		description: 'Rating for accuracy',
		example: 4,
		minimum: 1,
		maximum: 5,
	})
	@IsNumber()
	@Min(1)
	@Max(5)
	accuracy: number;

	@ApiProperty({
		description: 'Rating for check-in process',
		example: 5,
		minimum: 1,
		maximum: 5,
	})
	@IsNumber()
	@Min(1)
	@Max(5)
	checkIn: number;

	@ApiProperty({
		description: 'Rating for communication',
		example: 4,
		minimum: 1,
		maximum: 5,
	})
	@IsNumber()
	@Min(1)
	@Max(5)
	communication: number;

	@ApiProperty({
		description: 'Rating for location',
		example: 5,
		minimum: 1,
		maximum: 5,
	})
	@IsNumber()
	@Min(1)
	@Max(5)
	location: number;

	@ApiProperty({
		description: 'Rating for value',
		example: 4,
		minimum: 1,
		maximum: 5,
	})
	@IsNumber()
	@Min(1)
	@Max(5)
	value: number;

	@ApiProperty({
		description: 'Optional comment for the rating',
		example: 'The room was spotless and the location was perfect!',
		required: false,
	})
	@IsOptional()
	@IsString()
	comment?: string;
}
