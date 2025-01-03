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
import { PaginateParams, PaginateData, SortOrder } from '@/types/common.type';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

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

	async getAllPromotions(
		userRole: string,
		userId: string,
		params: PaginateParams,
	): Promise<PaginateData<Promotion>> {
		const {
			page = 1,
			limit = 10,
			sortBy = 'createdAt',
			sortOrder = SortOrder.DESC,
		} = params;

		const skip = (page - 1) * limit;
		const sortOptions: Record<string, 1 | -1> = {
			[sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
		};

		if (userRole === 'admin') {
			const [count, promotions] = await Promise.all([
				this.promotionModel.countDocuments().exec(),
				this.promotionModel
					.find()
					.sort(sortOptions as any)
					.skip(skip)
					.limit(limit)
					.exec(),
			]);

			const totalPages = Math.ceil(count / limit);

			return {
				docs: promotions,
				totalDocs: count,
				page,
				limit,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
				nextPage: page < totalPages ? page + 1 : null,
				prevPage: page > 1 ? page - 1 : null,
				pagingCounter: skip + 1,
			};
		}

		if (!Types.ObjectId.isValid(userId)) {
			throw new BadRequestException('Invalid ID format');
		}

		const userPromotion = await this.userPromotionModel
			.findOne({ userId })
			.exec();

		const currentDate = new Date();

		const allPromotions = await this.promotionModel
			.find({
				amount: { $gt: 0 },
				startDate: { $lte: currentDate },
				endDate: { $gte: currentDate },
			})
			.exec();

		if (!userPromotion) {
			const count = allPromotions.length;
			const totalPages = Math.ceil(count / limit);

			return {
				docs: allPromotions.slice(skip, skip + limit),
				totalDocs: count,
				page,
				limit,
				totalPages,
				hasNextPage: page < totalPages,
				hasPrevPage: page > 1,
				nextPage: page < totalPages ? page + 1 : null,
				prevPage: page > 1 ? page - 1 : null,
				pagingCounter: skip + 1,
			};
		}

		const usedPromotionIds = userPromotion.promotions.map((p) => p.promotionId);

		const availablePromotions = allPromotions.filter(
			(promotion) => !usedPromotionIds.includes(promotion.id.toString()),
		);

		const count = availablePromotions.length;
		const totalPages = Math.ceil(count / limit);

		return {
			docs: availablePromotions.slice(skip, skip + limit),
			totalDocs: count,
			page,
			limit,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			pagingCounter: skip + 1,
		};
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

	async exportPromotionsToExcel(res: Response): Promise<void> {
		const promotions = await this.promotionModel.find().exec();

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Promotions');

		worksheet.columns = [
			{ header: 'ID', key: 'id', width: 30 },
			{ header: 'Promotion Name', key: 'promotionName', width: 30 },
			{ header: 'Description', key: 'description', width: 30 },
			{ header: 'Amount', key: 'amount', width: 20 },
			{ header: 'Discount', key: 'discount', width: 20 },
			{ header: 'Start Date', key: 'startDate', width: 20 },
			{ header: 'End Date', key: 'endDate', width: 20 },
		];

		promotions.forEach((promotion) => {
			worksheet.addRow({
				id: promotion.id,
				promotionName: promotion.promotionName,
				description: promotion.description,
				amount: promotion.amount,
				discount: promotion.discount,
				startDate: promotion.startDate,
				endDate: promotion.endDate,
			});
		});

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader(
			'Content-Disposition',
			'attachment; filename=promotions.xlsx',
		);
		await workbook.xlsx.write(res);
		res.end();
	}
}
