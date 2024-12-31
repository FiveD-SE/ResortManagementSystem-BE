import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsDate,
	IsNotEmpty,
	IsOptional,
	IsArray,
	IsString,
	ValidateNested,
	IsNumber,
	IsEnum,
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

	@ApiProperty()
	@IsNotEmpty()
	@ValidateNested()
	@Type(() => GuestsDto)
	guests: {
		adults: number;
		children: number;
	};

	@ApiProperty({ enum: ['Transfer', 'Pay on arrival'] })
	@IsNotEmpty()
	@IsEnum(['Transfer', 'Pay on arrival'])
	paymentMethod: string;
}

class GuestsDto {
	@IsNumber()
	@IsNotEmpty()
	adults: number;

	@IsNumber()
	@IsNotEmpty()
	children: number;
}
