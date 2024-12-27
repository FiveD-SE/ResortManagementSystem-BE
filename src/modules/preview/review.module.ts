import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomReview, RoomReviewSchema } from './entities/roomReview.entity';
import {
	ServiceReview,
	ServiceReviewSchema,
} from './entities/serviceReview.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: RoomReview.name, schema: RoomReviewSchema },
			{ name: ServiceReview.name, schema: ServiceReviewSchema },
		]),
	],
	providers: [ReviewService],
	controllers: [ReviewController],
})
export class ReviewModule {}
