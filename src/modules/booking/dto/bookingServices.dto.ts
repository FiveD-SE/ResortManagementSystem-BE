import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ServiceWithQuantity {
	@IsNotEmpty()
	@IsString()
	serviceId: string;

	@IsNotEmpty()
	quantity: number;
}

export class BookingServicesDTO {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ServiceWithQuantity)
	servicesWithQuantities: ServiceWithQuantity[];
}
