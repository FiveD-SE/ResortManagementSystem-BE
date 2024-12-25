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
import { CreatePromotionRequestDto } from './dto/createPromotion.request.dto';

@Injectable()
export class PromotionService {
	constructor(
		@InjectModel(Promotion.name)
		private readonly promotionModel: Model<PromotionDocument>,
		@InjectModel(UserPromotion.name)
		private readonly userPromotionModel: Model<UserPromotionDocument>,
	) {}

	async createPromotion(
		promotionDto: CreatePromotionRequestDto,
	): Promise<Promotion> {
		const newPromotion = new this.promotionModel(promotionDto);
		return await newPromotion.save();
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
