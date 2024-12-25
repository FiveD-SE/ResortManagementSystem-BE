import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { Room, RoomSchema } from './entities/room.entity';
import { RoomType, RoomTypeSchema } from '../roomType/entities/roomType.entity';
import { ImgurModule } from '../imgur/imgur.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
		MongooseModule.forFeature([
			{ name: RoomType.name, schema: RoomTypeSchema },
		]),
		ImgurModule,
	],
	controllers: [RoomController],
	providers: [RoomService],
})
export class RoomModule {}
