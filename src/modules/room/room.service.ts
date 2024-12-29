import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoomDTO } from './dto/createRoom.dto';
import { UpdateRoomDTO } from './dto/updateRoom.dto';
import { Room, RoomDocument } from './entities/room.entity';
import {
	RoomType,
	RoomTypeDocument,
} from '../roomType/entities/roomType.entity';
import { ImgurService } from '../imgur/imgur.service';
import { PaginateParams, PaginateData, SortOrder } from '@/types/common.type';
import { RoomDetailDTO } from './dto/roomDetail.dto';
import { Rating } from '../rating/entities/rating.entity';
import { GetRoomsResponseDTO } from './dto/getRooms.response';
import { Booking, BookingDocument } from '../booking/entities/booking.entity';

@Injectable()
export class RoomService {
	constructor(
		@InjectModel(Room.name) private roomModel: Model<RoomDocument>,
		@InjectModel(RoomType.name) private roomTypeModel: Model<RoomTypeDocument>,
		@InjectModel(Rating.name) private ratingModel: Model<Rating>,
		private readonly imgurService: ImgurService,
		@InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
	) {}

	/**
	 * Maps a Room document to RoomDTO.
	 * @param room The Room document.
	 * @returns The RoomDTO.
	 */
	private async mapToRoomDTO(
		room: RoomDocument,
		bookingCount: number,
	): Promise<GetRoomsResponseDTO> {
		const roomType = await this.roomTypeModel.findById(room.roomTypeId).exec();
		if (!roomType) {
			throw new NotFoundException(
				`RoomType with ID ${room.roomTypeId} not found`,
			);
		}

		return {
			id: room._id.toString(),
			roomNumber: room.roomNumber,
			roomTypeId: room.roomTypeId.toString(),
			status: room.status,
			pricePerNight: room.pricePerNight,
			images: room.images,
			averageRating: room.averageRating,
			roomTypeName: roomType.typeName,
			bookingCount: bookingCount,
		};
	}

	async create(
		createRoomDto: CreateRoomDTO,
		files: Express.Multer.File[],
	): Promise<Room> {
		const roomType = await this.roomTypeModel
			.findById(createRoomDto.roomTypeId)
			.exec();
		if (!roomType) {
			throw new BadRequestException(
				`RoomType with ID ${createRoomDto.roomTypeId} not found`,
			);
		}

		const imageUrls = await Promise.all(
			files.map((file) => this.imgurService.uploadImage(file)),
		);

		const newRoom = new this.roomModel({
			...createRoomDto,
			images: imageUrls.map((res) => res.imageUrl),
		});
		return newRoom.save();
	}

	async findAll(
		params: PaginateParams,
	): Promise<PaginateData<GetRoomsResponseDTO>> {
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

		const [count, rooms] = await Promise.all([
			this.roomModel.countDocuments().exec(),
			this.roomModel
				.aggregate([
					{
						$lookup: {
							from: 'bookings',
							let: { room_id: { $toString: '$_id' } },
							pipeline: [
								{
									$match: {
										$expr: {
											$eq: ['$roomId', '$$room_id'],
										},
									},
								},
							],
							as: 'bookings',
						},
					},
					{
						$addFields: {
							bookingCount: { $size: '$bookings' },
						},
					},
					{ $sort: sortOptions },
					{ $skip: skip },
					{ $limit: Number(limit) },
				])
				.exec(),
		]);

		const totalPages = Math.ceil(count / limit);
		const roomDTOs = await Promise.all(
			rooms.map((room) => this.mapToRoomDTO(room, room.bookingCount)),
		);

		return {
			docs: roomDTOs,
			totalDocs: count,
			page,
			limit: Number(limit),
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			pagingCounter: skip + 1,
		};
	}

	async findByRoomTypeId(
		roomTypeId: string,
		params: PaginateParams,
	): Promise<PaginateData<GetRoomsResponseDTO>> {
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

		const [count, rooms] = await Promise.all([
			this.roomModel.countDocuments().exec(),
			this.roomModel
				.aggregate([
					{
						$lookup: {
							from: 'bookings',
							let: { room_id: { $toString: '$_id' } },
							pipeline: [
								{
									$match: {
										$expr: {
											$eq: ['$roomId', '$$room_id'],
										},
									},
								},
							],
							as: 'bookings',
						},
					},
					{
						$addFields: {
							bookingCount: { $size: '$bookings' },
						},
					},
					{ $sort: sortOptions },
					{ $skip: skip },
					{ $limit: Number(limit) },
				])
				.exec(),
		]);
		const totalPages = Math.ceil(count / limit);
		const roomDTOs = await Promise.all(
			rooms.map((room) => this.mapToRoomDTO(room, room.bookingCount)),
		);

		return {
			docs: roomDTOs,
			totalDocs: count,
			page,
			limit: Number(limit),
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			pagingCounter: skip + 1,
		};
	}

	async findOne(id: string): Promise<Room> {
		const room = await this.roomModel.findById(id).exec();
		if (!room) {
			throw new NotFoundException(`Room with ID ${id} not found`);
		}
		return room;
	}

	async update(
		id: string,
		updateRoomDto: UpdateRoomDTO,
		files: Express.Multer.File[],
	): Promise<Room> {
		if (updateRoomDto.roomTypeId) {
			const roomType = await this.roomTypeModel
				.findById(updateRoomDto.roomTypeId)
				.exec();
			if (!roomType) {
				throw new BadRequestException(
					`RoomType with ID ${updateRoomDto.roomTypeId} not found`,
				);
			}
		}

		const imageUrls = files.length
			? await Promise.all(
					files.map((file) => this.imgurService.uploadImage(file)),
				)
			: [];

		const updatedRoom = await this.roomModel
			.findByIdAndUpdate(
				id,
				{
					...updateRoomDto,
					...(imageUrls.length && {
						images: imageUrls.map((res) => res.imageUrl),
					}),
				},
				{ new: true },
			)
			.exec();
		if (!updatedRoom) {
			throw new NotFoundException(`Room with ID ${id} not found`);
		}
		return updatedRoom;
	}

	async remove(id: string): Promise<void> {
		const result = await this.roomModel.findByIdAndDelete(id).exec();
		if (!result) {
			throw new NotFoundException(`Room with ID ${id} not found`);
		}
	}

	/**
	 * Retrieves detailed information for a specific room, including room type data and all ratings.
	 * Also includes average scores for each rating category and the total number of ratings.
	 * @param id The ID of the room.
	 * @returns Detailed room information with ratings, averages, and count.
	 */
	async getRoomDetail(id: string): Promise<RoomDetailDTO> {
		const room = await this.roomModel.findById(id).exec();
		if (!room) {
			throw new NotFoundException(`Room with ID ${id} not found`);
		}

		const roomType = await this.roomTypeModel.findById(room.roomTypeId).exec();
		if (!roomType) {
			throw new NotFoundException(
				`RoomType with ID ${room.roomTypeId} not found`,
			);
		}

		const ratings = await this.ratingModel.find({ roomId: room._id }).exec();

		const totalRatings = ratings.length;
		const averageScores = {
			cleanliness: 0,
			accuracy: 0,
			checkIn: 0,
			communication: 0,
			location: 0,
			value: 0,
		};

		if (totalRatings > 0) {
			ratings.forEach((rating) => {
				averageScores.cleanliness += rating.cleanliness;
				averageScores.accuracy += rating.accuracy;
				averageScores.checkIn += rating.checkIn;
				averageScores.communication += rating.communication;
				averageScores.location += rating.location;
				averageScores.value += rating.value;
			});

			averageScores.cleanliness = parseFloat(
				(averageScores.cleanliness / totalRatings).toFixed(2),
			);
			averageScores.accuracy = parseFloat(
				(averageScores.accuracy / totalRatings).toFixed(2),
			);
			averageScores.checkIn = parseFloat(
				(averageScores.checkIn / totalRatings).toFixed(2),
			);
			averageScores.communication = parseFloat(
				(averageScores.communication / totalRatings).toFixed(2),
			);
			averageScores.location = parseFloat(
				(averageScores.location / totalRatings).toFixed(2),
			);
			averageScores.value = parseFloat(
				(averageScores.value / totalRatings).toFixed(2),
			);
		}

		const ratingCounts = {
			oneStar: 0,
			twoStars: 0,
			threeStars: 0,
			fourStars: 0,
			fiveStars: 0,
		};

		ratings.forEach((rating) => {
			const average = Math.round(rating.average);
			switch (average) {
				case 1:
					ratingCounts.oneStar += 1;
					break;
				case 2:
					ratingCounts.twoStars += 1;
					break;
				case 3:
					ratingCounts.threeStars += 1;
					break;
				case 4:
					ratingCounts.fourStars += 1;
					break;
				case 5:
					ratingCounts.fiveStars += 1;
					break;
				default:
					break;
			}
		});

		const bookings = await this.bookingModel.find({ roomId: room.id }).exec();
		const occupiedDates = bookings.map((booking) => ({
			checkinDate: booking.checkinDate,
			checkoutDate: booking.checkoutDate,
		}));

		return {
			room,
			roomType,
			ratings,
			averageScores,
			ratingCount: totalRatings,
			ratingCounts,
			occupiedDates,
		};
	}
}
