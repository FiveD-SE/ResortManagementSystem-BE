import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Promotion, PromotionSchema } from './entities/promotion.entity';
import {
	UserPromotion,
	UserPromotionSchema,
} from './entities/userPromotion.entity';
import { PromotionController } from './promotion.controller';
import { UserPromotionController } from './userPromotion.controller';
import { PromotionService } from './promotion.service';
import { UserPromotionService } from './userPromotion.service';
import { UserModule } from '../user/user.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Promotion.name, schema: PromotionSchema },
		]),
		MongooseModule.forFeature([
			{ name: UserPromotion.name, schema: UserPromotionSchema },
		]),
		UserModule,
	],
	controllers: [PromotionController, UserPromotionController],
	providers: [PromotionService, UserPromotionService],
	exports: [PromotionService, UserPromotionService],
})
export class PromotionModule {}
