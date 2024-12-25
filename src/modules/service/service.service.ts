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

@Injectable()
export class ServiceService {
	constructor(
		@InjectModel(Service.name)
		private readonly serviceModel: Model<Service>,
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

	async findAll(): Promise<Service[]> {
		return this.serviceModel.find().exec();
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

	async findByServiceTypeId(serviceTypeId: string): Promise<Service[]> {
		if (!Types.ObjectId.isValid(serviceTypeId)) {
			throw new BadRequestException('Invalid ServiceType ID format');
		}

		if (serviceTypeId) {
			const serviceType = await this.serviceTypeService.findOne(serviceTypeId);
			if (!serviceType) {
				throw new NotFoundException(
					`Service with Service type ID ${serviceTypeId} not found`,
				);
			}
		}

		const services = await this.serviceModel
			.find({ serviceTypeId: serviceTypeId })
			.exec();

		if (!services || services.length === 0) {
			throw new NotFoundException(
				`No services found for ServiceType ID ${serviceTypeId}`,
			);
		}

		return services;
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
}
