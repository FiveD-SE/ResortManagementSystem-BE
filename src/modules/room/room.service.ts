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

	async findAll(): Promise<Room[]> {
		return this.roomModel.find().exec();
	}

	async findOne(id: string): Promise<Room> {
		const room = await this.roomModel.findById(id).exec();
		if (!room) {
			throw new NotFoundException(`Room with ID ${id} not found`);
		}
		return room;
	}

	async findByRoomTypeId(roomTypeId: string): Promise<Room[]> {
		const rooms = await this.roomModel.find({ roomTypeId }).exec();
		if (!rooms || rooms.length === 0) {
			throw new NotFoundException(
				`No rooms found with RoomType ID ${roomTypeId}`,
			);
		}
		return rooms;
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
