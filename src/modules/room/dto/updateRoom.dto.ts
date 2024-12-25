import {
	IsEnum,
	IsOptional,
	IsNumber,
	IsString,
	MaxLength,
	IsArray,
	ArrayNotEmpty,
} from 'class-validator';
import { RoomStatus } from '../entities/room.entity';

export class UpdateRoomDTO {
	@IsOptional()
	@IsString()
	@MaxLength(5)
	roomNumber?: string;

	@IsOptional()
	@IsString()
	roomTypeId?: string;

	@IsOptional()
	@IsEnum(RoomStatus)
	status?: RoomStatus;

	@IsOptional()
	@IsNumber()
	pricePerNight?: number;

	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	images?: string[];
}
