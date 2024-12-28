import { ApiProperty } from '@nestjs/swagger';
import { Room } from '../entities/room.entity';
import { RoomType } from '../../roomType/entities/roomType.entity';
import { Rating } from '../../rating/entities/rating.entity';

export class RoomDetailDTO {
	@ApiProperty({ description: 'Room information', type: () => Room })
	room: Room;

	@ApiProperty({ description: 'Room type information', type: () => RoomType })
	roomType: RoomType;

	@ApiProperty({
		description: 'List of ratings for the room',
		type: [Rating],
		nullable: true,
	})
	ratings?: Rating[];

	@ApiProperty({
		description: 'Average scores for each rating category',
		type: Object,
		example: {
			cleanliness: 4.5,
			accuracy: 4.2,
			checkIn: 4.8,
			communication: 4.3,
			location: 4.7,
			value: 4.4,
		},
	})
	averageScores: {
		cleanliness: number;
		accuracy: number;
		checkIn: number;
		communication: number;
		location: number;
		value: number;
	};

	@ApiProperty({
		description: 'Total number of ratings',
		example: 25,
	})
	ratingCount: number;

	@ApiProperty({
		description: 'Number of ratings for each star',
		type: Object,
		example: {
			oneStar: 2,
			twoStars: 1,
			threeStars: 5,
			fourStars: 8,
			fiveStars: 9,
		},
	})
	ratingCounts: {
		oneStar: number;
		twoStars: number;
		threeStars: number;
		fourStars: number;
		fiveStars: number;
	};

	@ApiProperty({
		description: 'Occupied dates for the room',
		type: Array,
		items: {
			type: 'object',
			properties: {
				checkinDate: { type: 'string', format: 'date-time' },
				checkoutDate: { type: 'string', format: 'date-time' },
			},
		},
	})
	occupiedDates: { checkinDate: Date; checkoutDate: Date }[];
}
