import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room, RoomSchema } from './entities/room.entity';
import { RoomType, RoomTypeSchema } from '../roomType/entities/roomType.entity';
import { ImgurModule } from '../imgur/imgur.module';
import { Rating, RatingSchema } from '../rating/entities/rating.entity';
import { RatingService } from '../rating/rating.service';
import { RatingController } from '../rating/rating.controller';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
		MongooseModule.forFeature([
			{ name: RoomType.name, schema: RoomTypeSchema },
		]),
		MongooseModule.forFeature([{ name: Rating.name, schema: RatingSchema }]),
		ImgurModule,
	],
	controllers: [RoomController, RatingController],
	providers: [RoomService, RatingService],
	exports: [RoomService],
})
export class RoomModule {}
