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

	async getAllRoomReview(): Promise<RoomReview[]> {
		return await this.roomReviewModel.find().exec();
	}

	async getRoomReviewByRoomId(roomId: string): Promise<RoomReview[]> {
		if (!Types.ObjectId.isValid(roomId)) {
			throw new BadRequestException('Invalid Room ID format');
		}

		const roomReviews = await this.roomReviewModel.find({ roomId }).exec();
		if (!roomReviews || roomReviews.length === 0) {
			throw new NotFoundException(`No reviews found for Room ID ${roomId}`);
		}

		return roomReviews;
	}

	async getRoomReviewByUserId(userId: string): Promise<RoomReview[]> {
		if (!Types.ObjectId.isValid(userId)) {
			throw new BadRequestException('Invalid User ID format');
		}

		const userReviews = await this.roomReviewModel
			.find({ customerId: userId })
			.exec();
		if (!userReviews || userReviews.length === 0) {
			throw new NotFoundException(`No reviews found for User ID ${userId}`);
		}

		return userReviews;
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
