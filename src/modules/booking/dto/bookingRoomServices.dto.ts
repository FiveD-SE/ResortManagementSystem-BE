import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RoomServiceWithQuantity {
	@IsNotEmpty()
	@IsString()
	roomServiceId: string;

	@IsNotEmpty()
	quantity: number;
}

export class BookingRoomServicesDTO {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => RoomServiceWithQuantity)
	roomServicesWithQuantities: RoomServiceWithQuantity[];
}
