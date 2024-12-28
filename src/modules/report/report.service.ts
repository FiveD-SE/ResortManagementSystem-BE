import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './entities/report.entity';
import { CreateReportRequestDto } from './dto/createReport.request.dto';
import { PaginateParams, PaginateData, SortOrder } from '@/types/common.type';

@Injectable()
export class ReportService {
	constructor(
		@InjectModel(Report.name)
		private readonly reportModel: Model<ReportDocument>,
	) {}

	async createWithUserId(
		userId: string,
		createReportDto: CreateReportRequestDto,
	): Promise<Report> {
		const createdReport = new this.reportModel({
			...createReportDto,
			generatedBy: userId,
		});
		return await createdReport.save();
	}

	async findAll(params: PaginateParams): Promise<PaginateData<Report>> {
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

		const [count, items] = await Promise.all([
			this.reportModel.countDocuments().exec(),
			this.reportModel
				.find()
				.sort(sortOptions as any)
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

	async findOne(id: string): Promise<Report> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		const report = await this.reportModel.findById(id).exec();
		if (!report) {
			throw new NotFoundException(`Report with ID ${id} not found`);
		}
		return report;
	}

	async remove(id: string): Promise<void> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		const result = await this.reportModel.deleteOne({ _id: id }).exec();
		if (result.deletedCount === 0) {
			throw new NotFoundException(`Report with ID ${id} not found`);
		}
	}
}
