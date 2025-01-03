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
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ServiceType } from '../serviceType/entities/serviceType.entity';

@Injectable()
export class ServiceService {
	constructor(
		@InjectModel(Service.name)
		private readonly serviceModel: Model<Service>,
		@InjectModel(ServiceType.name) private serviceTypeModel: Model<ServiceType>,
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

	async exportServicesToExcel(res: Response): Promise<void> {
		const services = await this.serviceModel.find().exec();
		const serviceTypes = await this.serviceTypeModel.find();

		const serviceTypeMap = serviceTypes.reduce((map, serviceType) => {
			map[serviceType._id.toString()] = serviceType;
			return map;
		}, {});

		const servicesWithTypeNames = services.map((service) => {
			const serviceType =
				serviceTypeMap[service.serviceTypeId.toString()] || null;
			return {
				...service.toObject(),
				serviceTypeName: serviceType ? serviceType.typeName : 'N/A',
			};
		});

		const workbook = new ExcelJS.Workbook();

		const addSheetWithData = (
			sheetName: string,
			data: any[],
			columns: { header: string; key: string; width: number }[],
			rowFormatter: (item: any) => Record<string, any>,
		) => {
			const sheet = workbook.addWorksheet(sheetName);
			sheet.columns = columns;
			data.forEach((item) => {
				sheet.addRow(rowFormatter(item));
			});
		};

		addSheetWithData(
			'Services',
			servicesWithTypeNames,
			[
				{ header: 'Service ID', key: 'id', width: 30 },
				{ header: 'Name', key: 'name', width: 25 },
				{ header: 'Service Type', key: 'serviceTypeName', width: 30 },
				{ header: 'Description', key: 'description', width: 50 },
				{ header: 'Price', key: 'price', width: 15 },
			],
			(service) => ({
				id: service._id.toString(),
				name: service.serviceName,
				serviceTypeName: service.serviceTypeName || 'N/A',
				description: service.description || 'N/A',
				price: service.price || 0,
			}),
		);

		addSheetWithData(
			'Service Types',
			serviceTypes,
			[
				{ header: 'Service Type ID', key: 'id', width: 30 },
				{ header: 'Name', key: 'name', width: 30 },
				{ header: 'Description', key: 'description', width: 50 },
			],
			(serviceType) => ({
				id: serviceType._id.toString(),
				name: serviceType.typeName,
				description: serviceType.description || 'N/A',
			}),
		);

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader('Content-Disposition', 'attachment; filename=services.xlsx');
		await workbook.xlsx.write(res);
		res.end();
	}
}
