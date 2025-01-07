import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RoomService, RoomServiceSchema } from './entities/roomService.entity';
import { RoomServiceService } from './roomService.service';
import { RoomServiceController } from './roomService.controller';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: RoomService.name, schema: RoomServiceSchema },
		]),
	],
	providers: [RoomServiceService],
	controllers: [RoomServiceController],
	exports: [RoomServiceService],
})
export class RoomServiceModule {}
