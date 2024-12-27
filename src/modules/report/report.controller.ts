import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	UseGuards,
	Req,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportRequestDto } from './dto/createReport.request.dto';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Report } from './entities/report.entity';
import { RequestWithUser } from '@/types/request.type';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

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
	findAll(): Promise<Report[]> {
		return this.reportService.findAll();
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
