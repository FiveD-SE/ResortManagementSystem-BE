import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportRequestDto } from './dto/createReport.request.dto';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '@/decorators/currentUser.decorator';
import { Report } from './entities/report.entity';

@Controller('reports')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class ReportController {
	constructor(private readonly reportService: ReportService) {}

	@Post()
	create(
		@Body() createReportDto: CreateReportRequestDto,
		@CurrentUser('id') userId: string,
	): Promise<Report> {
		return this.reportService.createWithUserId(userId, createReportDto);
	}

	@Get()
	findAll(): Promise<Report[]> {
		return this.reportService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string): Promise<Report> {
		return this.reportService.findOne(id);
	}

	@Delete(':id')
	remove(@Param('id') id: string): Promise<void> {
		return this.reportService.remove(id);
	}
}
