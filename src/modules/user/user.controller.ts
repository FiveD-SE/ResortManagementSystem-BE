import {
	Body,
	Controller,
	ForbiddenException,
	Get,
	Param,
	Patch,
	Post,
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

import { ApiBodyWithSingleFile } from '@/decorators/apiBodyWithSingleFile.decorator';
import { ApiPost } from '@/decorators/apiPost.decorator';
import MongooseClassSerializerInterceptor from '@/interceptors/mongooseClassSerializer.interceptor';
import { RequestWithUser } from '@/types/request.type';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { ChangeProfileRequestDTO } from './dto/request/changeProfile.request.dto';
import { User, UserRole } from './entities/user.entity';
import { UserService } from './user.service';
import { CreateUserRequestDTO } from './dto/request/createUser.request.dto';
import { Roles } from '@/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@UseInterceptors(MongooseClassSerializerInterceptor(User))
@Controller('users')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(':userID')
	async findOne(@Param('userID') id: string, @Req() request: RequestWithUser) {
		if (
			request.user.role !== UserRole.Admin &&
			request.user._id.toString() !== id
		) {
			throw new ForbiddenException('You can only access your own profile');
		}
		return this.userService.getUser(id);
	}

	@Post()
	@Roles(UserRole.Admin)
	async create(
		@Body() createUserRequestDTO: CreateUserRequestDTO,
	): Promise<User> {
		return this.userService.create(createUserRequestDTO);
	}

	@Patch('change-profile')
	@ApiOkResponse({ type: User })
	@UseGuards(JwtAccessTokenGuard)
	update(
		@Req() req: RequestWithUser,
		@Body() updateUserDto: ChangeProfileRequestDTO,
	) {
		return this.userService.update(req.user._id.toString(), updateUserDto);
	}

	@ApiPost({ path: 'change-avatar' })
	@ApiBodyWithSingleFile('avatarFile', null, ['avatarFile'])
	@ApiOkResponse({ type: User })
	@UseGuards(JwtAccessTokenGuard)
	changeAvatar(
		@Req() request: RequestWithUser,
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.userService.changeAvatar(request.user._id.toString(), file);
	}
}
