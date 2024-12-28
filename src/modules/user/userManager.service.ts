import { BaseServiceAbstract } from '@/services/base/base.abstract.service';
import { Inject, Injectable } from '@nestjs/common';
import { User, UserDocument } from './entities/user.entity';
import { UserRepositoryInterface } from './interfaces/user.interface';
import { UpdateUserRequestDTO } from './dto/request/updateUser.request.dto';
import { UserService } from './user.service';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class UserManagerService extends BaseServiceAbstract<User> {
	constructor(
		@Inject('UsersRepositoryInterface')
		private readonly userRepo: UserRepositoryInterface,
		private readonly userService: UserService,
		@InjectModel(User.name)
		private readonly userModel: Model<UserDocument>,
	) {
		super(userRepo);
	}

	async updateUser(id: string, dto: UpdateUserRequestDTO): Promise<User> {
		await this.userService.getUser(id);

		return await this.update(id, dto);
	}

	async findAllWithPagination(
		params: PaginateParams,
		role: string,
	): Promise<PaginateData<User>> {
		const {
			page = 1,
			limit = 10,
			sortBy = 'createdAt',
			sortOrder = SortOrder.DESC,
		} = params;

		const skip = (page - 1) * limit;
		const sortOptions: Record<string, 1 | -1> = {
			[sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
		};

		let query = {};
		if (role) {
			if (role === 'staff') {
				query = { role: { $in: ['receptionist', 'service_staff'] } };
			} else {
				query = { role };
			}
		}

		const [count, users] = await Promise.all([
			this.userModel.countDocuments(query).exec(),
			this.userModel
				.find(query)
				.sort(sortOptions as any)
				.skip(skip)
				.limit(limit)
				.exec(),
		]);

		const totalPages = Math.ceil(count / limit);

		return {
			docs: users,
			totalDocs: count,
			page,
			limit,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			pagingCounter: skip + 1,
		};
	}
}
