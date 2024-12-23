import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoomTypeDTO } from './dto/createRoomType.request.dto';
import { UpdateRoomTypeDTO } from './dto/updateRoomType.request.dto';
import { RoomType, RoomTypeDocument } from './entities/roomType.entity';

@Injectable()
export class RoomTypeService {
	constructor(
		@InjectModel(RoomType.name) private roomTypeModel: Model<RoomTypeDocument>,
	) {}

	async create(createRoomTypeDto: CreateRoomTypeDTO): Promise<RoomType> {
		const newRoomType = new this.roomTypeModel(createRoomTypeDto);
		return newRoomType.save();
	}

	async findAll(): Promise<RoomType[]> {
		return this.roomTypeModel.find().exec();
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
