import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoomTypeDTO } from './dto/createRoomType.request.dto';
import { UpdateRoomTypeDTO } from './dto/updateRoomType.request.dto';
import { RoomType, RoomTypeDocument } from './entities/roomType.entity';
import { PaginateParams, PaginateData } from '@/types/common.type';

@Injectable()
export class RoomTypeService {
	constructor(
		@InjectModel(RoomType.name) private roomTypeModel: Model<RoomTypeDocument>,
	) {}

	async create(createRoomTypeDto: CreateRoomTypeDTO): Promise<RoomType> {
		const newRoomType = new this.roomTypeModel(createRoomTypeDto);
		return newRoomType.save();
	}

	async findAll(params: PaginateParams): Promise<PaginateData<RoomType>> {
		const { page, limit, sort } = params;
		const skip = (page - 1) * limit;
		const sortOption = sort === 'asc' ? 1 : -1;

		const [count, items] = await Promise.all([
			this.roomTypeModel.countDocuments().exec(),
			this.roomTypeModel
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

	async findOne(id: string): Promise<RoomType> {
		const roomType = await this.roomTypeModel.findById(id).exec();
		if (!roomType) {
			throw new NotFoundException(`RoomType with ID ${id} not found`);
		}
		return roomType;
	}

	async update(
		id: string,
		updateRoomTypeDto: UpdateRoomTypeDTO,
	): Promise<RoomType> {
		const updatedRoomType = await this.roomTypeModel
			.findByIdAndUpdate(id, updateRoomTypeDto, { new: true })
			.exec();
		if (!updatedRoomType) {
			throw new NotFoundException(`RoomType with ID ${id} not found`);
		}
		return updatedRoomType;
	}

	async remove(id: string): Promise<void> {
		const result = await this.roomTypeModel.findByIdAndDelete(id).exec();
		if (!result) {
			throw new NotFoundException(`RoomType with ID ${id} not found`);
		}
	}
}
