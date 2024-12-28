import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { CreateRoomTypeDTO } from './dto/createRoomType.request.dto';
import { UpdateRoomTypeDTO } from './dto/updateRoomType.request.dto';
import { RoomTypeService } from './roomType.service';
import { RoomType } from './entities/roomType.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { Query } from '@nestjs/common';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '@/decorators/auth.decorator';

@Controller('room-types')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class RoomTypeController {
	constructor(private readonly roomTypeService: RoomTypeService) {}

	@Post()
	@Roles(UserRole.Admin)
	create(@Body() createRoomTypeDto: CreateRoomTypeDTO): Promise<RoomType> {
		return this.roomTypeService.create(createRoomTypeDto);
	}

	@Get()
	@Public()
	@ApiPaginationQuery()
	@ApiOperation({ summary: 'Get all room types with pagination and sorting' })
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['typeName', 'basePrice', 'guestAmount', 'createdAt'],
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
	): Promise<PaginateData<RoomType>> {
		const validSortFields = [
			'typeName',
			'basePrice',
			'guestAmount',
			'createdAt',
		];

		if (query.sortBy && !validSortFields.includes(query.sortBy)) {
			throw new BadRequestException(
				`Sort field must be one of: ${validSortFields.join(', ')}`,
			);
		}

		return this.roomTypeService.findAll(query);
	}

	@Get(':id')
	findOne(@Param('id') id: string): Promise<RoomType> {
		return this.roomTypeService.findOne(id);
	}

	@Patch(':id')
	update(
		@Param('id') id: string,
		@Body() updateRoomTypeDto: UpdateRoomTypeDTO,
	): Promise<RoomType> {
		return this.roomTypeService.update(id, updateRoomTypeDto);
	}

	@Delete(':id')
	@Roles(UserRole.Admin)
	remove(@Param('id') id: string): Promise<void> {
		return this.roomTypeService.remove(id);
	}
}
