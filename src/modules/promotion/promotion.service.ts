import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Promotion, PromotionDocument } from './entities/promotion.entity';
import {
	UserPromotion,
	UserPromotionDocument,
} from './entities/userPromotion.entity';
import { User } from '../user/entities/user.entity';
import { CreatePromotionRequestDto } from './dto/createPromotion.request.dto';

@Injectable()
export class PromotionService {
	constructor(
		@InjectModel(Promotion.name)
		private readonly promotionModel: Model<PromotionDocument>,
		@InjectModel(UserPromotion.name)
		private readonly userPromotionModel: Model<UserPromotionDocument>,
		@InjectModel(User.name)
		private readonly userModel: Model<User>,
	) {}

	async createPromotion(
		promotionDto: CreatePromotionRequestDto,
	): Promise<Promotion> {
		const users = await this.userModel
			.find({ role: 'user', isActive: true })
			.exec();

		if (!users || users.length === 0) {
			throw new NotFoundException('No active users with role "user" found');
		}
		const newPromotion = new this.promotionModel({
			...promotionDto,
		});
		const promotion = await newPromotion.save();

		for (const user of users) {
			await this.userPromotionModel.findOneAndUpdate(
				{ userId: user._id },
				{
					$push: {
						promotions: {
							promotionId: promotion._id,
							promotionName: promotion.promotionName,
							description: promotion.description,
							discount: promotion.discount,
							startDate: promotion.startDate,
							endDate: promotion.endDate,
							quantity: promotion.quantityPerUser,
						},
					},
				},
				{ upsert: true, new: true },
			);
		}

		return promotion;
	}

	async getAllPromotions(): Promise<Promotion[]> {
		return this.promotionModel.find().exec();
	}

	async getPromotionById(promotionId: string): Promise<Promotion> {
		if (!Types.ObjectId.isValid(promotionId)) {
			throw new BadRequestException('Invalid Promotion ID');
		}
		const promotion = await this.promotionModel.findById(promotionId).exec();
		if (!promotion) {
			throw new NotFoundException('Promotion not found');
		}
		return promotion;
	}

	async deletePromotion(promotionId: string): Promise<void> {
		if (!Types.ObjectId.isValid(promotionId)) {
			throw new BadRequestException('Invalid Promotion ID');
		}

		const deletedPromotion = await this.promotionModel
			.findByIdAndDelete(promotionId)
			.exec();
		if (!deletedPromotion) {
			throw new NotFoundException('Promotion not found');
		}
		await this.userPromotionModel.updateMany(
			{},
			{ $pull: { promotions: { promotionId } } },
		);
	}
}
