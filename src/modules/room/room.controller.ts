import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UploadedFiles,
	UseGuards,
	Query,
} from '@nestjs/common';
import { CreateRoomDTO } from './dto/createRoom.dto';
import { UpdateRoomDTO } from './dto/updateRoom.dto';
import { RoomService } from './room.service';
import { Room } from './entities/room.entity';
import { GetRoomsResponseDTO } from './dto/getRooms.response';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { ApiBodyWithFiles } from '@/decorators/apiBodyWithFiles.decorator';
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RoomDetailDTO } from './dto/roomDetail.dto';
import { Public } from '@/decorators/auth.decorator';

@Controller('rooms')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class RoomController {
	constructor(private readonly roomService: RoomService) {}

	@Post()
	@Roles(UserRole.Admin)
	@ApiBodyWithFiles(
		'images',
		10,
		{
			roomNumber: { type: 'string', maxLength: 5 },
			roomTypeId: { type: 'string' },
			status: {
				type: 'string',
				enum: ['Available', 'Occupied', 'Under Maintenance'],
			},
			pricePerNight: { type: 'number' },
		},
		['roomNumber', 'roomTypeId', 'status', 'pricePerNight'],
	)
	@ApiOperation({ summary: 'Create a new room' })
	@ApiResponse({
		status: 201,
		description: 'Room created successfully.',
		type: Room,
	})
	create(
		@Body() createRoomDto: CreateRoomDTO,
		@UploadedFiles() files: Express.Multer.File[],
	): Promise<Room> {
		return this.roomService.create(createRoomDto, files);
	}

	@Get()
	@Public()
	@ApiPaginationQuery()
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: [
			'roomNumber',
			'status',
			'pricePerNight',
			'createdAt',
			'averageRating',
			'bookingCount',
		],
		description: 'Field to sort by',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: SortOrder,
		description: 'Sort order (asc/desc)',
	})
	findAll(
		@Query() query: PaginateParams,
	): Promise<PaginateData<GetRoomsResponseDTO>> {
		const validSortFields = [
			'roomNumber',
			'status',
			'pricePerNight',
			'createdAt',
			'averageRating',
			'bookingCount',
		];

		if (query.sortBy && !validSortFields.includes(query.sortBy)) {
			throw new BadRequestException(
				`Sort field must be one of: ${validSortFields.join(', ')}`,
			);
		}

		return this.roomService.findAll(query);
	}

	@Get('filter')
	@Public()
	@ApiQuery({ name: 'amenities', required: false, type: [String] })
	@ApiQuery({ name: 'guestAmount', required: false, type: Number })
	@ApiQuery({ name: 'bedAmount', required: false, type: Number })
	@ApiQuery({ name: 'bedroomAmount', required: false, type: Number })
	@ApiQuery({ name: 'searchKeyFeature', required: false, type: String })
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['averageRating', 'pricePerNight'],
		description: 'Field to sort by',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: ['asc', 'desc'],
		description: 'Sort order (asc/desc)',
	})
	@ApiQuery({
		name: 'page',
		required: false,
		type: Number,
		description: 'Page number',
	})
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Items per page',
	})
	@ApiQuery({
		name: 'checkinDate',
		required: false,
		type: Date,
		description: 'Check-in date',
	})
	@ApiQuery({
		name: 'checkoutDate',
		required: false,
		type: Date,
		description: 'Check-out date',
	})
	async filterRoomsByRoomTypeFields(
		@Query('amenities') amenitiesRaw?: string | string[],
		@Query('guestAmount') guestAmountRaw?: string,
		@Query('bedAmount') bedAmountRaw?: string,
		@Query('bedroomAmount') bedroomAmountRaw?: string,
		@Query('searchKeyFeature') searchKeyFeature?: string,
		@Query('sortBy') sortBy?: 'averageRating' | 'pricePerNight',
		@Query('sortOrder') sortOrder?: 'asc' | 'desc',
		@Query('page') page = 1,
		@Query('limit') limit = 10,
		@Query('checkinDate') checkinDate?: string,
		@Query('checkoutDate') checkoutDate?: string,
	): Promise<PaginateData<Room>> {
		const guestAmount = guestAmountRaw
			? parseInt(guestAmountRaw, 10)
			: undefined;
		const bedAmount = bedAmountRaw ? parseInt(bedAmountRaw, 10) : undefined;
		const bedroomAmount = bedroomAmountRaw
			? parseInt(bedroomAmountRaw, 10)
			: undefined;
		const amenities = Array.isArray(amenitiesRaw)
			? amenitiesRaw
			: amenitiesRaw
				? [amenitiesRaw]
				: undefined;
		const checkin = checkinDate ? new Date(checkinDate) : undefined;
		const checkout = checkoutDate ? new Date(checkoutDate) : undefined;

		return this.roomService.filterRoomsByRoomTypeFields(
			amenities,
			guestAmount,
			bedAmount,
			bedroomAmount,
			searchKeyFeature,
			sortBy,
			sortOrder as 'asc' | 'desc',
			page,
			limit,
			checkin,
			checkout,
		);
	}

	@Get(':id')
	@Public()
	@ApiOperation({ summary: 'Get a specific room by ID' })
	@ApiResponse({
		status: 200,
		description: 'Room details.',
		type: Room,
	})
	findOne(@Param('id') id: string): Promise<Room> {
		return this.roomService.findOne(id);
	}

	@Get('roomType/:roomTypeId')
	@Public()
	@ApiPaginationQuery()
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: [
			'roomNumber',
			'status',
			'pricePerNight',
			'createdAt',
			'averageRating',
			'bookingCount',
		],
		description: 'Field to sort by',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: SortOrder,
		description: 'Sort order (asc/desc)',
	})
	@ApiOperation({ summary: 'Get rooms by Room Type ID with room type names' })
	@ApiResponse({
		status: 200,
		description: 'List of rooms filtered by room type ID with room type names.',
		type: [GetRoomsResponseDTO],
	})
	findByRoomTypeId(
		@Param('roomTypeId') roomTypeId: string,
		@Query() query: PaginateParams,
	): Promise<PaginateData<GetRoomsResponseDTO>> {
		const validSortFields = [
			'roomNumber',
			'status',
			'pricePerNight',
			'createdAt',
			'averageRating',
			'bookingCount',
		];

		if (query.sortBy && !validSortFields.includes(query.sortBy)) {
			throw new BadRequestException(
				`Sort field must be one of: ${validSortFields.join(', ')}`,
			);
		}

		return this.roomService.findByRoomTypeId(roomTypeId, query);
	}

	@Patch(':id')
	@Roles(UserRole.Admin)
	@ApiBodyWithFiles('images', 10, {
		roomNumber: { type: 'string', maxLength: 5 },
		roomTypeId: { type: 'string' },
		status: {
			type: 'string',
			enum: ['Available', 'Occupied', 'Under Maintenance'],
		},
		pricePerNight: { type: 'number' },
	})
	update(
		@Param('id') id: string,
		@Body() updateRoomDto: UpdateRoomDTO,
		@UploadedFiles() files: Express.Multer.File[],
	): Promise<Room> {
		return this.roomService.update(id, updateRoomDto, files);
	}

	@Delete(':id')
	@Roles(UserRole.Admin)
	remove(@Param('id') id: string): Promise<void> {
		return this.roomService.remove(id);
	}

	/**
	 * @route GET /rooms/:id/detail
	 * @description Retrieves detailed information for a specific room, including room type data, all ratings, average scores, and rating count.
	 */
	@Get(':id/detail')
	@Public()
	@ApiOperation({
		summary:
			'Get detailed information of a room including ratings, averages, and count',
	})
	@ApiResponse({
		status: 200,
		description:
			'Detailed room information with room type, ratings, average scores, and rating count.',
		type: RoomDetailDTO,
	})
	async getRoomDetail(@Param('id') id: string): Promise<RoomDetailDTO> {
		return this.roomService.getRoomDetail(id);
	}
}
