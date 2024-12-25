import { BaseServiceAbstract } from '@/services/base/base.abstract.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import { ImgurService } from '../imgur/imgur.service';
import { ChangeProfileRequestDTO } from './dto/request/changeProfile.request.dto';
import { User } from './entities/user.entity';
import { UserRepositoryInterface } from './interfaces/user.interface';

@Injectable()
export class UserService extends BaseServiceAbstract<User> {
	constructor(
		@Inject('UsersRepositoryInterface')
		private readonly userRepo: UserRepositoryInterface,
		private readonly imgurService: ImgurService,
	) {
		super(userRepo);
	}

	async getUser(data: string): Promise<User> {
		const key: string = isValidObjectId(data) ? '_id' : 'email';
		const u = await this.findOne({ [key]: data });

		if (!u) throw new BadRequestException('User not found');

		return u;
	}

	async changeAvatar(userID: string, file: Express.Multer.File): Promise<User> {
		await this.getUser(userID);
		const avatar = await this.imgurService.uploadImage(file);

		return await this.userRepo.update(userID, {
			avatar: avatar.imageUrl,
		});
	}

	async changeProfileInfo(
		userID: string,
		dto: ChangeProfileRequestDTO,
	): Promise<User> {
		await this.getUser(userID);

		return await this.userRepo.update(userID, dto);
	}
}
