import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './entities/report.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
	],
	providers: [ReportService],
	controllers: [ReportController],
	exports: [ReportService],
})
export class ReportModule {}
