import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './entities/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
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
	exports: [UserService, UserManagerService, MongooseModule],
})
export class UserModule {}
