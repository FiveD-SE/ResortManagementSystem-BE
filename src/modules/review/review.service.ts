import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RoomReview, RoomReviewDocument } from './entities/roomReview.entity';
import {
	ServiceReview,
	ServiceReviewDocument,
} from './entities/serviceReview.entity';
import { CreateReviewRequestDto } from './dto/createReview.request.dto';
import { PaginateData, PaginateParams } from '@/types/common.type';
@Injectable()
export class ReviewService {
	constructor(
		@InjectModel(RoomReview.name)
		private readonly roomReviewModel: Model<RoomReviewDocument>,

		@InjectModel(ServiceReview.name)
		private readonly serviceReviewModel: Model<ServiceReviewDocument>,
	) {}

	async createReview(
		userId: string,
		createReviewRequestDto: CreateReviewRequestDto,
	): Promise<{ roomReview: RoomReview; serviceReviews: ServiceReview[] }> {
		const { roomId, rating, comment, services } = createReviewRequestDto;

		const roomReview = new this.roomReviewModel({
			customerId: userId,
			roomId,
			rating,
			comment,
		});
		await roomReview.save();

		const serviceReviews: ServiceReview[] = [];
		if (services && services.length > 0) {
			for (const service of services) {
				const serviceReview = new this.serviceReviewModel({
					customerId: userId,
					serviceId: service.serviceId,
					rating: service.rating,
				});
				await serviceReview.save();
				serviceReviews.push(serviceReview);
			}
		}

		return { roomReview, serviceReviews };
	}

	async getAllRoomReview(
		params: PaginateParams,
	): Promise<PaginateData<RoomReview>> {
		const { page = 1, limit = 10, sort = 'desc' } = params;
		const skip = (page - 1) * limit;
		const sortOption = sort === 'asc' ? 1 : -1;

		const [count, items] = await Promise.all([
			this.roomReviewModel.countDocuments().exec(),
			this.roomReviewModel
				.find()
				.sort({ createdAt: sortOption })
				.skip(skip)
				.limit(limit)
				.exec(),
		]);

		const totalPages = Math.ceil(count / limit);

		return {
			page,
			limit,
			totalDocs: count,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			totalPages,
			pagingCounter: skip + 1,
			docs: items,
		};
	}

	async getRoomReviewByRoomId(
		roomId: string,
		params: PaginateParams,
	): Promise<PaginateData<RoomReview>> {
		if (!Types.ObjectId.isValid(roomId)) {
			throw new BadRequestException('Invalid Room ID format');
		}

		const { page = 1, limit = 10, sort = 'desc' } = params;
		const skip = (page - 1) * limit;
		const sortOption = sort === 'asc' ? 1 : -1;

		const [count, roomReviews] = await Promise.all([
			this.roomReviewModel.countDocuments({ roomId }).exec(),
			this.roomReviewModel
				.find({ roomId })
				.sort({ createdAt: sortOption })
				.skip(skip)
				.limit(limit)
				.exec(),
		]);

		if (!roomReviews || roomReviews.length === 0) {
			throw new NotFoundException(`No reviews found for Room ID ${roomId}`);
		}

		const totalPages = Math.ceil(count / limit);

		return {
			page,
			limit,
			totalDocs: count,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			totalPages,
			pagingCounter: skip + 1,
			docs: roomReviews,
		};
	}

	async getRoomReviewByUserId(
		userId: string,
		params: PaginateParams,
	): Promise<PaginateData<RoomReview>> {
		if (!Types.ObjectId.isValid(userId)) {
			throw new BadRequestException('Invalid User ID format');
		}

		const { page = 1, limit = 10, sort = 'desc' } = params;
		const skip = (page - 1) * limit;
		const sortOption = sort === 'asc' ? 1 : -1;

		const [count, userReviews] = await Promise.all([
			this.roomReviewModel.countDocuments({ customerId: userId }).exec(),
			this.roomReviewModel
				.find({ customerId: userId })
				.sort({ createdAt: sortOption })
				.skip(skip)
				.limit(limit)
				.exec(),
		]);

		if (!userReviews || userReviews.length === 0) {
			throw new NotFoundException(`No reviews found for User ID ${userId}`);
		}

		const totalPages = Math.ceil(count / limit);

		return {
			page,
			limit,
			totalDocs: count,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			totalPages,
			pagingCounter: skip + 1,
			docs: userReviews,
		};
	}

	async getAverageRatingRoomReview(roomId: string): Promise<number> {
		if (!Types.ObjectId.isValid(roomId)) {
			throw new BadRequestException('Invalid Room ID format');
		}

		const reviews = await this.roomReviewModel.find({ roomId }).exec();
		if (reviews.length === 0) {
			return 0;
		}

		const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
		return totalRating / reviews.length;
	}

	async getAverageRatingServiceReview(
		serviceIds: string[],
	): Promise<{ serviceId: string; averageRating: number }[]> {
		const validServiceIds = serviceIds.filter((id) =>
			Types.ObjectId.isValid(id),
		);

		if (validServiceIds.length === 0) {
			throw new BadRequestException('No valid Service IDs provided');
		}

		const serviceRatings = await Promise.all(
			validServiceIds.map(async (serviceId) => {
				const reviews = await this.serviceReviewModel
					.find({ serviceId })
					.exec();

				if (reviews.length === 0) {
					return { serviceId, averageRating: 0 };
				}

				const totalRating = reviews.reduce(
					(sum, review) => sum + review.rating,
					0,
				);
				const averageRating = totalRating / reviews.length;

				return { serviceId, averageRating };
			}),
		);

		return serviceRatings;
	}

	async remove(roomReviewId: string): Promise<void> {
		if (!Types.ObjectId.isValid(roomReviewId)) {
			throw new BadRequestException('Invalid ID format');
		}
		const result = await this.roomReviewModel
			.deleteOne({ _id: roomReviewId })
			.exec();
		if (result.deletedCount === 0) {
			throw new NotFoundException(`Report with ID ${roomReviewId} not found`);
		}
	}
}
