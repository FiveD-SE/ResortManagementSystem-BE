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
import { ApiQuery, ApiTags } from '@nestjs/swagger';

import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { RoomServiceService } from './roomService.service';
import { CreateRoomServiceRequestDto } from './dto/createRoomService.request.dto';
import { RoomService } from './entities/roomService.entity';
import { UpdateRoomServiceRequestDto } from './dto/updateRoomService.request.dto';

@ApiTags('Room Service')
@Controller('room-services')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class RoomServiceController {
	constructor(private readonly roomServiceService: RoomServiceService) {}

	@Post()
	@Roles(UserRole.Admin)
	create(
		@Body() createServiceDto: CreateRoomServiceRequestDto,
	): Promise<RoomService> {
		return this.roomServiceService.create(createServiceDto);
	}

	@Get()
	@ApiPaginationQuery()
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['serviceName', 'price', 'createdAt'],
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
	): Promise<PaginateData<RoomService>> {
		const validSortFields = ['serviceName', 'price', 'createdAt'];

		if (query.sortBy && !validSortFields.includes(query.sortBy)) {
			throw new BadRequestException(
				`Sort field must be one of: ${validSortFields.join(', ')}`,
			);
		}

		return this.roomServiceService.findAllWithPagination(query);
	}

	@Get(':id')
	findOne(@Param('id') id: string): Promise<RoomService> {
		return this.roomServiceService.findOne(id);
	}

	@Patch(':id')
	@Roles(UserRole.Admin)
	update(
		@Param('id') id: string,
		@Body() updateServiceDto: UpdateRoomServiceRequestDto,
	): Promise<RoomService> {
		return this.roomServiceService.update(id, updateServiceDto);
	}

	@Delete(':id')
	@Roles(UserRole.Admin)
	remove(@Param('id') id: string): Promise<void> {
		return this.roomServiceService.remove(id);
	}
}
