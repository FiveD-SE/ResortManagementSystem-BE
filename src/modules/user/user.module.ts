import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './entities/user.entity';
import { UsersRepository } from '@/repositories/user.repo';
import { ImgurModule } from '../imgur/imgur.module';
import { UserManagerService } from './userManager.service';
import { UserManagerController } from './userManager.controller';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
		ImgurModule,
	],
	controllers: [UserController, UserManagerController],
	providers: [
		UserService,
		UserManagerService,
		{ provide: 'UsersRepositoryInterface', useClass: UsersRepository },
	],
	exports: [UserService, UserManagerService],
})
export class UserModule {}
