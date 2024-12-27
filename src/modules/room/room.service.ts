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
import { PaginateParams, PaginateData } from '@/types/common.type';

@Injectable()
export class RoomService {
	constructor(
		@InjectModel(Room.name) private roomModel: Model<RoomDocument>,
		@InjectModel(RoomType.name) private roomTypeModel: Model<RoomTypeDocument>,
		private readonly imgurService: ImgurService,
	) {}

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

	async findAll(params: PaginateParams): Promise<PaginateData<Room>> {
		const { page, limit, sort } = params;
		const skip = (page - 1) * limit;
		const sortOption = sort === 'asc' ? 1 : -1;

		const [count, items] = await Promise.all([
			this.roomModel.countDocuments().exec(),
			this.roomModel
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

	async findOne(id: string): Promise<Room> {
		const room = await this.roomModel.findById(id).exec();
		if (!room) {
			throw new NotFoundException(`Room with ID ${id} not found`);
		}
		return room;
	}

	async findByRoomTypeId(
		roomTypeId: string,
		params: PaginateParams,
	): Promise<PaginateData<Room>> {
		const { page, limit, sort } = params;
		const skip = (page - 1) * limit;
		const sortOption = sort === 'asc' ? 1 : -1;

		const [count, items] = await Promise.all([
			this.roomModel.countDocuments({ roomTypeId }).exec(),
			this.roomModel
				.find({ roomTypeId })
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
}
