import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Service } from './entities/service.entity';
import { CreateServiceRequestDto } from './dto/createService.request.dto';
import { UpdateServiceRequestDto } from './dto/updateService.request.dto';
import { ServiceTypeService } from '../serviceType/serviceType.service';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { ServiceType } from '../serviceType/entities/serviceType.entity';

@Injectable()
export class ServiceService {
	constructor(
		@InjectModel(Service.name)
		private readonly serviceModel: Model<Service>,
		@InjectModel(ServiceType.name)
		private readonly serviceTypeModel: Model<ServiceType>,
		private readonly serviceTypeService: ServiceTypeService,
	) {}

	async create(createServiceDto: CreateServiceRequestDto): Promise<Service> {
		if (!Types.ObjectId.isValid(createServiceDto.serviceTypeId)) {
			throw new BadRequestException('Invalid ServiceType ID format');
		}
		const serviceType = await this.serviceTypeService.findOne(
			createServiceDto.serviceTypeId,
		);
		if (!serviceType) {
			throw new NotFoundException(
				`ServiceType with ID ${createServiceDto.serviceTypeId} not found`,
			);
		}

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

	async findAll(params: PaginateParams): Promise<PaginateData<Service>> {
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

	async findAllByRoomType(
		roomTypeId: string,
		params: PaginateParams,
	): Promise<PaginateData<Service>> {
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

		if (!Types.ObjectId.isValid(roomTypeId)) {
			throw new BadRequestException('Invalid ID format');
		}

		const serviceTypes = await this.serviceTypeModel
			.find({ roomTypeId: roomTypeId })
			.exec();

		const serviceTypeIds = serviceTypes.map((serviceType) => serviceType._id);

		if (serviceTypeIds.length === 0) {
			return {
				docs: [],
				totalDocs: 0,
				page,
				limit,
				totalPages: 0,
				hasNextPage: false,
				hasPrevPage: false,
				nextPage: null,
				prevPage: null,
				pagingCounter: skip + 1,
			};
		}

		const [count, services] = await Promise.all([
			this.serviceModel
				.countDocuments({
					serviceTypeId: { $in: serviceTypeIds },
				})
				.exec(),
			this.serviceModel
				.find({ serviceTypeId: { $in: serviceTypeIds } })
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

	async findOne(id: string): Promise<Service> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		const service = await this.serviceModel.findById(id).exec();
		if (!service) {
			throw new NotFoundException(`Service with ID ${id} not found`);
		}
		return service;
	}

	async findByServiceTypeId(
		serviceTypeId: string,
		params: PaginateParams,
	): Promise<PaginateData<Service>> {
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
			this.serviceModel.countDocuments({ serviceTypeId }).exec(),
			this.serviceModel
				.find({ serviceTypeId })
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

	async update(
		id: string,
		updateServiceDto: UpdateServiceRequestDto,
	): Promise<Service> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		if (!Types.ObjectId.isValid(updateServiceDto.serviceTypeId)) {
			throw new BadRequestException('Invalid ServiceType ID format');
		}

		if (updateServiceDto.serviceTypeId) {
			const serviceType = await this.serviceTypeService.findOne(
				updateServiceDto.serviceTypeId,
			);
			if (!serviceType) {
				throw new NotFoundException(
					`ServiceType with ID ${updateServiceDto.serviceTypeId} not found`,
				);
			}
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

	async findByIds(ids: string[]): Promise<Service[]> {
		return this.serviceModel.find({ _id: { $in: ids } }).exec();
	}
}
