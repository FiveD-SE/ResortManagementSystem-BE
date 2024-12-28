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
import { Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RoomDetailDTO } from './dto/roomDetail.dto';

@Controller('rooms')
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
	@ApiPaginationQuery()
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['roomNumber', 'status', 'pricePerNight', 'createdAt'],
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
		];

		if (query.sortBy && !validSortFields.includes(query.sortBy)) {
			throw new BadRequestException(
				`Sort field must be one of: ${validSortFields.join(', ')}`,
			);
		}

		return this.roomService.findAll(query);
	}

	@Get(':id')
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
	@ApiPaginationQuery()
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
