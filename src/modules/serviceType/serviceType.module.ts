import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ServiceTypeService } from './serviceType.service';
import { ServiceTypeController } from './serviceType.controller';
import { ServiceType, ServiceTypeSchema } from './entities/serviceType.entity';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: ServiceType.name, schema: ServiceTypeSchema },
		]),
	],
	providers: [ServiceTypeService],
	controllers: [ServiceTypeController],
	exports: [
		ServiceTypeService,
		MongooseModule.forFeature([
			{ name: ServiceType.name, schema: ServiceTypeSchema },
		]),
	],
})
export class ServiceTypeModule {}
