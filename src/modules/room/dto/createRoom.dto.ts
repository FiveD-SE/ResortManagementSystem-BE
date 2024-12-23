import {
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsString,
	MaxLength,
} from 'class-validator';
import { RoomStatus } from '../entities/room.entity';

export class CreateRoomDTO {
	@IsNotEmpty()
	@IsString()
	@MaxLength(5)
	roomNumber: string;

	@IsNotEmpty()
	@IsString()
	roomTypeId: string;

	@IsNotEmpty()
	@IsEnum(RoomStatus)
	status: RoomStatus;

	@IsNotEmpty()
	@IsNumber()
	pricePerNight: number;
}
