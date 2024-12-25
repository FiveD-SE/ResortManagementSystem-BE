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
import { Promotion, PromotionDocument } from './entities/promotion.entity';

@Injectable()
export class UserPromotionService {
	constructor(
		@InjectModel(Promotion.name)
		private readonly promotionModel: Model<PromotionDocument>,
		@InjectModel(UserPromotion.name)
		private readonly userPromotionModel: Model<UserPromotionDocument>,
	) {}

	async getAllUserPromotions(): Promise<UserPromotion[]> {
		return this.userPromotionModel.find().exec();
	}

	async getUserPromotionHistoryByUserId(
		userId: string,
	): Promise<UserPromotion> {
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

	async usePromotion(
		userId: string,
		promotionId: string,
	): Promise<UserPromotion> {
		if (
			!Types.ObjectId.isValid(userId) ||
			!Types.ObjectId.isValid(promotionId)
		) {
			throw new BadRequestException('Invalid ID format');
		}

		const promotion = await this.promotionModel.findById(promotionId).exec();
		if (!promotion) {
			throw new NotFoundException('Promotion not found');
		}

		if (promotion.amount <= 0) {
			throw new BadRequestException('Promotion is no longer available');
		}

		let userPromotion = await this.userPromotionModel
			.findOne({ userId })
			.exec();

		if (!userPromotion) {
			userPromotion = new this.userPromotionModel({ userId, promotions: [] });
		}

		const existingPromotion = userPromotion.promotions.find(
			(p) => p.promotionId === promotionId,
		);

		if (existingPromotion) {
			throw new BadRequestException('User has already used this promotion');
		}

		userPromotion.promotions.push({
			promotionId: promotion.id.toString(),
			promotionName: promotion.promotionName,
			description: promotion.description,
			discount: promotion.discount,
			startDate: promotion.startDate,
			endDate: promotion.endDate,
		});

		promotion.amount -= 1;
		await promotion.save();

		return await userPromotion.save();
	}
}
