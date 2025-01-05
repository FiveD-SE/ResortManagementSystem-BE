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

import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { Public } from '@/decorators/auth.decorator';
import { Roles } from '@/decorators/roles.decorator';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/entities/user.entity';
import { CreateRoomTypeDTO } from './dto/createRoomType.request.dto';
import { UpdateRoomTypeDTO } from './dto/updateRoomType.request.dto';
import { RoomType } from './entities/roomType.entity';
import { RoomTypeService } from './roomType.service';

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

	@Get('filter')
	@ApiQuery({ name: 'amenities', required: false, type: [String] })
	@ApiQuery({ name: 'guestAmount', required: false, type: Number })
	@ApiQuery({ name: 'bedAmount', required: false, type: Number })
	@ApiQuery({ name: 'bedroomAmount', required: false, type: Number })
	@ApiQuery({ name: 'searchKeyFeature', required: false, type: String })
	async filterRoomTypes(
		@Query('amenities') amenities?: string[],
		@Query('guestAmount') guestAmountRaw?: string,
		@Query('bedAmount') bedAmountRaw?: string,
		@Query('bedroomAmount') bedroomAmountRaw?: string,
		@Query('searchKeyFeature') searchKeyFeature?: string,
	): Promise<RoomType[]> {
		const guestAmount = guestAmountRaw
			? parseInt(guestAmountRaw, 10)
			: undefined;
		const bedAmount = bedAmountRaw ? parseInt(bedAmountRaw, 10) : undefined;
		const bedroomAmount = bedroomAmountRaw
			? parseInt(bedroomAmountRaw, 10)
			: undefined;

		return this.roomTypeService.filterRoomTypes(
			amenities,
			guestAmount,
			bedAmount,
			bedroomAmount,
			searchKeyFeature,
		);
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
