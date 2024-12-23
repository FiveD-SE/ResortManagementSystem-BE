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
	Req,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { ChangeProfileRequestDTO } from './dto/request/changeProfile.request.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
@UseInterceptors(MongooseClassSerializerInterceptor(User))
@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get(':userID')
	findOne(@Param('userID') id: string) {
		return this.userService.findByID(id);
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
