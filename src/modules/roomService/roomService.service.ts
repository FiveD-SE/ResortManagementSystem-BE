import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { RoomService } from './entities/roomService.entity';
import { CreateRoomServiceRequestDto } from './dto/createRoomService.request.dto';
import { UpdateRoomServiceRequestDto } from './dto/updateRoomService.request.dto';

@Injectable()
export class RoomServiceService {
	constructor(
		@InjectModel(RoomService.name)
		private readonly serviceModel: Model<RoomService>,
	) {}

	async create(
		createServiceDto: CreateRoomServiceRequestDto,
	): Promise<RoomService> {
		try {
			const createdService = new this.serviceModel(createServiceDto);
			return await createdService.save();
		} catch (error) {
			if (error.code === 11000) {
				throw new BadRequestException('The serviceName must be unique');
			}
			throw error;
		}
	}

	async findAll(): Promise<RoomService[]> {
		return this.serviceModel.find().exec();
	}

	async findAllWithPagination(
		params: PaginateParams,
	): Promise<PaginateData<RoomService>> {
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

		const [count, services] = await Promise.all([
			this.serviceModel.countDocuments().exec(),
			this.serviceModel
				.find()
				.sort(sortOptions as any)
				.skip(skip)
				.limit(limit)
				.exec(),
		]);

		const totalPages = Math.ceil(count / limit);

		return {
			docs: services,
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

	async findOne(id: string): Promise<RoomService> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		const service = await this.serviceModel.findById(id).exec();
		if (!service) {
			throw new NotFoundException(`Service with ID ${id} not found`);
		}
		return service;
	}

	async update(
		id: string,
		updateServiceDto: UpdateRoomServiceRequestDto,
	): Promise<RoomService> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		try {
			const updatedService = await this.serviceModel
				.findByIdAndUpdate(id, updateServiceDto, { new: true })
				.exec();
			if (!updatedService) {
				throw new NotFoundException(`Service with ID ${id} not found`);
			}
			return updatedService;
		} catch (error) {
			if (error.code === 11000) {
				throw new BadRequestException('The serviceName must be unique');
			}
			throw error;
		}
	}

	async remove(id: string): Promise<void> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		const result = await this.serviceModel.findByIdAndDelete(id).exec();
		if (!result) {
			throw new NotFoundException(`Service with ID ${id} not found`);
		}
	}
}
