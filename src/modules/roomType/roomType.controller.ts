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
import { CreateRoomTypeDTO } from './dto/createRoomType.request.dto';
import { UpdateRoomTypeDTO } from './dto/updateRoomType.request.dto';
import { RoomTypeService } from './roomType.service';
import { RoomType } from './entities/roomType.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

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
	findAll(): Promise<RoomType[]> {
		return this.roomTypeService.findAll();
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
