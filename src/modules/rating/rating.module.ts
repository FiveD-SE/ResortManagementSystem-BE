import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { Rating, RatingSchema } from './entities/rating.entity';
import { Room, RoomSchema } from '../room/entities/room.entity';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Rating.name, schema: RatingSchema },
			{ name: Room.name, schema: RoomSchema },
		]),
	],
	controllers: [RatingController],
	providers: [RatingService],
	exports: [RatingService],
})
export class RatingModule {}
