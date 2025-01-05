import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsDate,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
class GuestsDto {
	@IsNumber()
	@IsNotEmpty()
	adults: number;

	@IsNumber()
	@IsNotEmpty()
	children: number;
}

class ServiceWithQuantity {
	@IsNotEmpty()
	@IsString()
	serviceId: string;

	@IsNotEmpty()
	@IsNumber()
	quantity: number;
}

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
	@ValidateNested({ each: true })
	@Type(() => ServiceWithQuantity)
	servicesWithQuantities?: ServiceWithQuantity[];

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	promotionId?: string;

	@ApiProperty()
	@IsNotEmpty()
	@ValidateNested()
	@Type(() => GuestsDto)
	guests: GuestsDto;

	@ApiProperty({ enum: ['Transfer', 'Pay on arrival'] })
	@IsNotEmpty()
	@IsEnum(['Transfer', 'Pay on arrival'])
	paymentMethod: string;
}
