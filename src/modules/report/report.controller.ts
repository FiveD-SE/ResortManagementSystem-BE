import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	UseGuards,
	Req,
	Query,
	BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

import { ReportService } from './report.service';
import { CreateReportRequestDto } from './dto/createReport.request.dto';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Report } from './entities/report.entity';
import { RequestWithUser } from '@/types/request.type';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';

@Controller('reports')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class ReportController {
	constructor(private readonly reportService: ReportService) {}

	@Post()
	create(
		@Body() createReportDto: CreateReportRequestDto,
		@Req() req: RequestWithUser,
	): Promise<Report> {
		const { user } = req;
		return this.reportService.createWithUserId(user.id, createReportDto);
	}

	@Get()
	@ApiPaginationQuery()
	@ApiOperation({
		summary: 'Get all report with pagination and sorting',
	})
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['reportType', 'createdAt', 'updatedAt'],
		description: 'Field to sort by',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: SortOrder,
		description: 'Sort order (asc/desc)',
	})
	findAll(@Query() query: PaginateParams): Promise<PaginateData<Report>> {
		const validSortFields = ['reportType', 'createdAt', 'updatedAt'];

		if (query.sortBy && !validSortFields.includes(query.sortBy)) {
			throw new BadRequestException(
				`Sort field must be one of: ${validSortFields.join(', ')}`,
			);
		}
		return this.reportService.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id') id: string): Promise<Report> {
		return this.reportService.findOne(id);
	}

	@Delete(':id')
	@Roles(UserRole.Admin)
	remove(@Param('id') id: string): Promise<void> {
		return this.reportService.remove(id);
	}
}
