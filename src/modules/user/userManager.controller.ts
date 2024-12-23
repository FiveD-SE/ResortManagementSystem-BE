import { OnlyAdmin } from '@/decorators/auth.decorator';
import MongooseClassSerializerInterceptor from '@/interceptors/mongooseClassSerializer.interceptor';
import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Query,
	UseInterceptors,
} from '@nestjs/common';
import { UpdateUserRequestDTO } from './dto/request/updateUser.request.dto';
import { User } from './entities/user.entity';
import { UserManagerService } from './userManager.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { PaginateData } from '@/types/common.type';
@UseInterceptors(MongooseClassSerializerInterceptor(User))
@Controller('admin/users')
@ApiTags('User')
@OnlyAdmin()
export class UserManagerController {
	constructor(private readonly userManagerService: UserManagerService) {}

	@Get()
	@ApiOkResponse({ type: PaginateData<User> })
	@ApiPaginationQuery()
	@OnlyAdmin()
	findAllWithPagination(@Query() q) {
		return this.userManagerService.findAllWithPagination({}, q);
	}

	@Patch(':userID')
	@ApiOkResponse({ type: User })
	updateUser(
		@Param('userID') userID: string,
		@Body() dto: UpdateUserRequestDTO,
	): Promise<User> {
		return this.userManagerService.updateUser(userID, dto);
	}
}
