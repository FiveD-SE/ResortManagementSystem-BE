import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceRequestDto } from './dto/createService.request.dto';
import { UpdateServiceRequestDto } from './dto/updateService.request.dto';
import { Service } from './entities/service.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('services')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class ServiceController {
	constructor(private readonly serviceService: ServiceService) {}

	@Post()
	@Roles(UserRole.Admin)
	create(@Body() createServiceDto: CreateServiceRequestDto): Promise<Service> {
		return this.serviceService.create(createServiceDto);
	}

	@Get()
	findAll(): Promise<Service[]> {
		return this.serviceService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string): Promise<Service> {
		return this.serviceService.findOne(id);
	}

	@Get('get-by-service-id/:serviceTypeId')
	findByServiceTypeId(
		@Param('serviceTypeId') serviceTypeId: string,
	): Promise<Service[]> {
		return this.serviceService.findByServiceTypeId(serviceTypeId);
	}

	@Patch(':id')
	@Roles(UserRole.Admin)
	update(
		@Param('id') id: string,
		@Body() updateServiceDto: UpdateServiceRequestDto,
	): Promise<Service> {
		return this.serviceService.update(id, updateServiceDto);
	}

	@Delete(':id')
	@Roles(UserRole.Admin)
	remove(@Param('id') id: string): Promise<void> {
		return this.serviceService.remove(id);
	}
}
