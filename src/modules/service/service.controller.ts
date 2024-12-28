import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
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
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { PaginateData, PaginateParams } from '@/types/common.type';

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
	@ApiPaginationQuery()
	async findAll(
		@Query() query: PaginateParams,
	): Promise<PaginateData<Service>> {
		return this.serviceService.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id') id: string): Promise<Service> {
		return this.serviceService.findOne(id);
	}

	@Get('service-type/:serviceTypeId')
	@ApiPaginationQuery()
	async findByServiceTypeId(
		@Param('serviceTypeId') serviceTypeId: string,
		@Query() query: PaginateParams,
	): Promise<PaginateData<Service>> {
		return this.serviceService.findByServiceTypeId(serviceTypeId, query);
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
