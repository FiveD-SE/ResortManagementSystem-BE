import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RoomServiceUpdate {
	@IsNotEmpty()
	@IsString()
	roomServiceId: string;

	@IsNotEmpty()
	quantity: number;
}

export class UpdateRoomServicesDTO {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => RoomServiceUpdate)
	roomServices: RoomServiceUpdate[];
}
