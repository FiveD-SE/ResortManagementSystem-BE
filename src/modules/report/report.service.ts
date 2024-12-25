import {
	Injectable,
	NotFoundException,
	BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './entities/report.entity';
import { CreateReportRequestDto } from './dto/createReport.request.dto';

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

	async findAll(): Promise<Report[]> {
		return this.reportModel.find().exec();
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
