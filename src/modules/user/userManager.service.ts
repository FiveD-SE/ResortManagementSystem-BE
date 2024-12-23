import { BaseServiceAbstract } from '@/services/base/base.abstract.service';
import { Inject, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserRepositoryInterface } from './interfaces/user.interface';
import { UpdateUserRequestDTO } from './dto/request/updateUser.request.dto';
import { UserService } from './user.service';
import { PaginateData } from '@/types/common.type';

@Injectable()
export class UserManagerService extends BaseServiceAbstract<User> {
	constructor(
		@Inject('UsersRepositoryInterface')
		private readonly userRepo: UserRepositoryInterface,
		private readonly userService: UserService,
	) {
		super(userRepo);
	}

	async updateUser(id: string, dto: UpdateUserRequestDTO): Promise<User> {
		await this.userService.getUser(id);

		return await this.update(id, dto);
	}

	async findAllWithPagination(
		filter = {},
		options = {},
	): Promise<PaginateData<User>> {
		return await this.userRepo.findAllWithPagination(filter, options);
	}
}
