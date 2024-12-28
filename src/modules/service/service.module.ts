import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from './entities/service.entity';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { ServiceTypeModule } from '../serviceType/serviceType.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
		ServiceTypeModule,
	],
	providers: [ServiceService],
	controllers: [ServiceController],
	exports: [ServiceService],
})
export class ServiceModule {}
