import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
	UserPromotion,
	UserPromotionDocument,
} from './entities/userPromotion.entity';

@Injectable()
export class UserPromotionService {
	constructor(
		@InjectModel(UserPromotion.name)
		private readonly userPromotionModel: Model<UserPromotionDocument>,
	) {}

	async getAllUserPromotions(): Promise<UserPromotion[]> {
		return this.userPromotionModel.find().exec();
	}

	async getUserPromotionByUserId(userId: string): Promise<UserPromotion> {
		if (!Types.ObjectId.isValid(userId)) {
			throw new BadRequestException('Invalid ID format');
		}
		const userPromotion = await this.userPromotionModel
			.findOne({ userId })
			.exec();
		if (!userPromotion) {
			throw new NotFoundException('UserPromotion not found for this user');
		}
		return userPromotion;
	}
}
