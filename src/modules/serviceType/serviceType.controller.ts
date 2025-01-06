import {
	BadRequestException,
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
import { ApiOperation, ApiQuery } from '@nestjs/swagger';

import { ServiceTypeService } from './serviceType.service';
import { CreateServiceTypeRequestDto } from './dto/createServiceType.request.dto';
import { UpdateServiceTypeRequestDto } from './dto/updateServiceType.request.dto';
import { ServiceType } from './entities/serviceType.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';

@Controller('service-types')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class ServiceTypeController {
	constructor(private readonly serviceTypeService: ServiceTypeService) {}

	@Post()
	@Roles(UserRole.Admin)
	create(
		@Body() createServiceTypeDto: CreateServiceTypeRequestDto,
	): Promise<ServiceType> {
		return this.serviceTypeService.create(createServiceTypeDto);
	}

	@Get()
	@ApiPaginationQuery()
	@ApiOperation({
		summary: 'Get all service types with pagination and sorting',
	})
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['typeName', 'createdAt', 'updatedAt'],
		description: 'Field to sort by',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: SortOrder,
		description: 'Sort order (asc/desc)',
	})
	async findAll(
		@Query() query: PaginateParams,
	): Promise<PaginateData<ServiceType>> {
		const validSortFields = ['typeName', 'createdAt', 'updatedAt'];

		if (query.sortBy && !validSortFields.includes(query.sortBy)) {
			throw new BadRequestException(
				`Sort field must be one of: ${validSortFields.join(', ')}`,
			);
		}

		return this.serviceTypeService.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id') id: string): Promise<ServiceType> {
		return this.serviceTypeService.findOne(id);
	}

	@Patch(':id')
	@Roles(UserRole.Admin)
	update(
		@Param('id') id: string,
		@Body() updateServiceTypeDto: UpdateServiceTypeRequestDto,
	): Promise<ServiceType> {
		return this.serviceTypeService.update(id, updateServiceTypeDto);
	}

	@Delete(':id')
	@Roles(UserRole.Admin)
	remove(@Param('id') id: string): Promise<void> {
		return this.serviceTypeService.remove(id);
	}

	@Get('roomType/:roomTypeId')
	@ApiOperation({
		summary: 'Get all service types by room type ID',
	})
	findAllByRoomType(
		@Param('roomTypeId') roomTypeId: string,
	): Promise<ServiceType[]> {
		return this.serviceTypeService.findAllByRoomType(roomTypeId);
	}
}
