import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rating, RatingDocument } from './entities/rating.entity';
import { CreateRatingDTO } from './dto/createRating.request';
import { Room, RoomDocument } from '../room/entities/room.entity';

@Injectable()
export class RatingService {
	constructor(
		@InjectModel(Rating.name) private ratingModel: Model<RatingDocument>,
		@InjectModel(Room.name) private roomModel: Model<RoomDocument>,
	) {}

	async addRating(
		roomId: string,
		userId: string,
		createRatingDto: CreateRatingDTO,
	): Promise<Rating> {
		const room = await this.roomModel.findById(roomId);
		if (!room) {
			throw new NotFoundException(`Room with ID ${roomId} not found`);
		}

		const rating = new this.ratingModel({
			...createRatingDto,
			userId: new Types.ObjectId(userId),
			roomId: new Types.ObjectId(roomId),
		});

		const savedRating = await rating.save();
		const ratings = await this.ratingModel
			.find({ roomId: room._id })
			.select('id');

		const averageRating = await this.calculateAverageRating(
			ratings.map((r) => r.id),
		);
		room.averageRating = averageRating;
		await room.save();

		return savedRating;
	}

	private async calculateAverageRating(
		ratingIds: Types.ObjectId[],
	): Promise<number> {
		const ratings = await this.ratingModel.find({ _id: { $in: ratingIds } });
		const total = ratings.reduce((acc, rating) => {
			return (
				acc +
				rating.cleanliness +
				rating.accuracy +
				rating.checkIn +
				rating.communication +
				rating.location +
				rating.value
			);
		}, 0);
		return ratings.length
			? parseFloat((total / (ratings.length * 6)).toFixed(2))
			: 0;
	}
}
