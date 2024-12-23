import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomTypeService } from './roomType.service';
import { RoomTypeController } from './roomType.controller';
import { RoomType, RoomTypeSchema } from './entities/roomType.entity';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: RoomType.name, schema: RoomTypeSchema },
		]),
	],
	controllers: [RoomTypeController],
	providers: [RoomTypeService],
})
export class RoomTypeModule {}
