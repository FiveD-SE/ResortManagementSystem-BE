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
import { CreateRoomDTO } from './dto/createRoom.dto';
import { UpdateRoomDTO } from './dto/updateRoom.dto';
import { RoomService } from './room.service';
import { Room } from './entities/room.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('rooms')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class RoomController {
	constructor(private readonly roomService: RoomService) {}

	@Post()
	@Roles(UserRole.Admin)
	create(@Body() createRoomDto: CreateRoomDTO): Promise<Room> {
		return this.roomService.create(createRoomDto);
	}

	@Get()
	findAll(): Promise<Room[]> {
		return this.roomService.findAll();
	}

	@Get(':id')
	findOne(@Param('id') id: string): Promise<Room> {
		return this.roomService.findOne(id);
	}

	@Get('roomType/:roomTypeId')
	findByRoomTypeId(@Param('roomTypeId') roomTypeId: string): Promise<Room[]> {
		return this.roomService.findByRoomTypeId(roomTypeId);
	}

	@Patch(':id')
	@Roles(UserRole.Admin)
	update(
		@Param('id') id: string,
		@Body() updateRoomDto: UpdateRoomDTO,
	): Promise<Room> {
		return this.roomService.update(id, updateRoomDto);
	}

	@Delete(':id')
	@Roles(UserRole.Admin)
	remove(@Param('id') id: string): Promise<void> {
		return this.roomService.remove(id);
	}
}
