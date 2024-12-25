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

@Injectable()
export class ServiceTypeService {
	constructor(
		@InjectModel(ServiceType.name)
		private readonly serviceTypeModel: Model<ServiceTypeDocument>,
	) {}

	async create(
		createServiceTypeDto: CreateServiceTypeRequestDto,
	): Promise<ServiceType> {
		try {
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

	async findAll(): Promise<ServiceType[]> {
		return this.serviceTypeModel.find().exec();
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
