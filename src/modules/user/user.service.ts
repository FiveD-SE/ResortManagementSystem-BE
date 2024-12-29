import { BaseServiceAbstract } from '@/services/base/base.abstract.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ImgurService } from '../imgur/imgur.service';
import { ChangeProfileRequestDTO } from './dto/request/changeProfile.request.dto';
import { User, UserRole } from './entities/user.entity';
import { UserRepositoryInterface } from './interfaces/user.interface';
import { CreateUserRequestDTO } from './dto/request/createUser.request.dto';

@Injectable()
export class UserService extends BaseServiceAbstract<User> {
	private readonly SALT_ROUND = 10;

	constructor(
		@Inject('UsersRepositoryInterface')
		private readonly userRepo: UserRepositoryInterface,
		private readonly imgurService: ImgurService,
	) {
		super(userRepo);
	}

	async create(createUserRequestDTO: CreateUserRequestDTO): Promise<User> {
		const hashedPassword = await bcrypt.hash(
			createUserRequestDTO.password,
			this.SALT_ROUND,
		);

		const userData: any = {
			...createUserRequestDTO,
			password: hashedPassword,
		};

		if (createUserRequestDTO.role === UserRole.Service_Staff) {
			if (!createUserRequestDTO.serviceTypeId) {
				throw new BadRequestException(
					'ServiceTypeId is required for service_staff role.',
				);
			}
			if (!Types.ObjectId.isValid(createUserRequestDTO.serviceTypeId)) {
				throw new BadRequestException('Invalid ID format');
			}
			userData.serviceTypeId = new Types.ObjectId(
				createUserRequestDTO.serviceTypeId,
			);
		} else {
			delete userData.serviceTypeId;
		}

		const createdUser = await this.userRepo.create(userData);

		if (createdUser.serviceTypeId) {
			(createdUser as any).serviceTypeId = createdUser.serviceTypeId.toString();
		}

		return createdUser;
	}

	async getUser(data: string): Promise<User> {
		const key: string = isValidObjectId(data) ? '_id' : 'email';
		const u = await this.findOne({ [key]: data });

		if (!u) throw new BadRequestException('User not found');

		if (u.serviceTypeId) {
			(u as any).serviceTypeId = u.serviceTypeId.toString();
		}

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
