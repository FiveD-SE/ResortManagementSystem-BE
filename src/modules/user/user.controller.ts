import { ApiBodyWithSingleFile } from '@/decorators/apiBodyWithSingleFile.decorator';
import { ApiPost } from '@/decorators/apiPost.decorator';
import MongooseClassSerializerInterceptor from '@/interceptors/mongooseClassSerializer.interceptor';
import { RequestWithUser } from '@/types/request.type';
import {
	Body,
	Controller,
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
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { ChangeProfileRequestDTO } from './dto/request/changeProfile.request.dto';
import { User, UserRole } from './entities/user.entity';
import { UserService } from './user.service';
import { CreateUserRequestDTO } from './dto/request/createUser.request.dto';
import { Roles } from '@/decorators/roles.decorator';
@UseInterceptors(MongooseClassSerializerInterceptor(User))
@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(':userID')
	@Roles(UserRole.Admin)
	findOne(@Param('userID') id: string) {
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
