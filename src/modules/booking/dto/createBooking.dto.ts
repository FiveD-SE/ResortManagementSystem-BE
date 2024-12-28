import { ApiProperty } from '@nestjs/swagger';
import {
	IsDate,
	IsNotEmpty,
	IsOptional,
	IsArray,
	IsString,
} from 'class-validator';

export class CreateBookingDTO {
	@ApiProperty()
	@IsNotEmpty()
	@IsDate()
	checkinDate: Date;

	@ApiProperty()
	@IsNotEmpty()
	@IsDate()
	checkoutDate: Date;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	serviceIds?: string[];

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	promotionId?: string;
}
