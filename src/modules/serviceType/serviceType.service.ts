import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CreateServiceTypeRequestDto } from './dto/createServiceType.request.dto';
import { UpdateServiceTypeRequestDto } from './dto/updateServiceType.request.dto';
import {
	ServiceType,
	ServiceTypeDocument,
} from './entities/serviceType.entity';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { RoomTypeService } from '../roomType/roomType.service';

@Injectable()
export class ServiceTypeService {
	constructor(
		@InjectModel(ServiceType.name)
		private readonly serviceTypeModel: Model<ServiceTypeDocument>,
		private readonly roomTypeService: RoomTypeService,
	) {}

	async create(
		createServiceTypeDto: CreateServiceTypeRequestDto,
	): Promise<ServiceType> {
		try {
			if (!Types.ObjectId.isValid(createServiceTypeDto.roomTypeId)) {
				throw new BadRequestException('Invalid ID format');
			}

			const roomType = await this.roomTypeService.findOne(
				createServiceTypeDto.roomTypeId,
			);

			if (!roomType) {
				throw new NotFoundException(
					`RoomType with ID ${createServiceTypeDto.roomTypeId} not found`,
				);
			}

			const createdServiceType = new this.serviceTypeModel(
				createServiceTypeDto,
			);
			return await createdServiceType.save();
		} catch (error) {
			if (error.code === 11000) {
				throw new BadRequestException('The typeName must be unique');
			}
			throw error;
		}
	}

	async findAll(params: PaginateParams): Promise<PaginateData<ServiceType>> {
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

		const [count, serviceTypes] = await Promise.all([
			this.serviceTypeModel.countDocuments().exec(),
			this.serviceTypeModel
				.find()
				.sort(sortOptions as any)
				.skip(skip)
				.limit(limit)
				.exec(),
		]);

		const totalPages = Math.ceil(count / limit);

		return {
			docs: serviceTypes,
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

	async findAllByRoomType(roomTypeId: string): Promise<ServiceType[]> {
		if (!Types.ObjectId.isValid(roomTypeId)) {
			throw new BadRequestException('Invalid ID format');
		}

		const roomType = await this.roomTypeService.findOne(roomTypeId);

		if (!roomType) {
			throw new NotFoundException(`RoomType with ID ${roomTypeId} not found`);
		}

		return this.serviceTypeModel.find({ roomTypeId }).exec();
	}

	async findOne(id: string): Promise<ServiceType> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		const serviceType = await this.serviceTypeModel.findById(id).exec();
		if (!serviceType) {
			throw new NotFoundException(`ServiceType with ID ${id} not found`);
		}
		return serviceType;
	}

	async update(
		id: string,
		updateServiceTypeDto: UpdateServiceTypeRequestDto,
	): Promise<ServiceType> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		if (!Types.ObjectId.isValid(updateServiceTypeDto.roomTypeId)) {
			throw new BadRequestException('Invalid ID format');
		}

		const roomType = await this.roomTypeService.findOne(
			updateServiceTypeDto.roomTypeId,
		);

		if (!roomType) {
			throw new NotFoundException(
				`RoomType with ID ${updateServiceTypeDto.roomTypeId} not found`,
			);
		}

		try {
			const updatedServiceType = await this.serviceTypeModel
				.findByIdAndUpdate(id, updateServiceTypeDto, { new: true })
				.exec();
			if (!updatedServiceType) {
				throw new NotFoundException(`ServiceType with ID ${id} not found`);
			}
			return updatedServiceType;
		} catch (error) {
			if (error.code === 11000) {
				throw new BadRequestException('The typeName must be unique');
			}
			throw error;
		}
	}

	async remove(id: string): Promise<void> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		const result = await this.serviceTypeModel.findByIdAndDelete(id).exec();
		if (!result) {
			throw new NotFoundException(`ServiceType with ID ${id} not found`);
		}
	}
}
