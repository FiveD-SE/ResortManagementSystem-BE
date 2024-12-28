import { ApiProperty } from '@nestjs/swagger';
import { RoomStatus } from '../entities/room.entity';

export class GetRoomsResponseDTO {
	@ApiProperty({ description: 'Room ID' })
	id: string;

	@ApiProperty({ description: 'Room Number', maxLength: 5 })
	roomNumber: string;

	@ApiProperty({ description: 'Room Type ID' })
	roomTypeId: string;

	@ApiProperty({
		description: 'Room Status',
		enum: RoomStatus,
	})
	status: RoomStatus;

	@ApiProperty({ description: 'Price per night' })
	pricePerNight: number;

	@ApiProperty({ description: 'Room Images', type: [String] })
	images: string[];

	@ApiProperty({ description: 'Average Rating' })
	averageRating: number;

	@ApiProperty({ description: 'Room Type Name' })
	roomTypeName: string;

	@ApiProperty({ description: 'Booking Count' })
	bookingCount: number;
}
