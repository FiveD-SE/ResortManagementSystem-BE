import { Module } from '@nestjs/common';
import { ImgurService } from './imgur.service';
import { ImgurController } from './imgur.controller';

@Module({
	controllers: [ImgurController],
	providers: [ImgurService],
	exports: [ImgurService],
})
export class ImgurModule {}
