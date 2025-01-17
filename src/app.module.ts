import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import * as Joi from 'joi';

import { UserModule } from '@/modules/user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './configs/db.config';
import { GlobalExceptionFilter } from './filters/globalException.filter';
import { TransformInterceptor } from './interceptors/apiResponse.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { ImgurModule } from './modules/imgur/imgur.module';
import { TokenModule } from './modules/token/token.module';
import { RoomTypeModule } from './modules/roomType/roomType.module';
import { RoomModule } from './modules/room/room.module';
import { ServiceTypeModule } from './modules/serviceType/serviceType.module';
import { ServiceModule } from './modules/service/service.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { ReportModule } from './modules/report/report.module';
import { RatingModule } from './modules/rating/rating.module';
import { BookingModule } from './modules/booking/booking.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { RoomServiceModule } from './modules/roomService/roomService.module';
@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: Joi.object({
				NODE_ENV: Joi.string()
					.valid('development', 'production', 'test', 'provision', 'staging')
					.default('development'),
				PORT: Joi.number().default(3333),
				DATABASE_URI: Joi.string().required(),
				DATABASE_NAME: Joi.string().required(),
				DATABASE_USERNAME: Joi.string().required(),
				DATABASE_PASSWORD: Joi.string().required(),
				DATABASE_HOST: Joi.string().required(),
				IMGUR_CLIENT_ID: Joi.string().required(),
				JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.number().required(),
				JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.number().required().min(1000),
				EMAIL_HOST: Joi.string().required(),
				EMAIL_PORT: Joi.number().required(),
				EMAIL_USER: Joi.string().required(),
				EMAIL_PASS: Joi.string().required(),
			}),
			validationOptions: {
				abortEarly: false,
			},
			isGlobal: true,
			envFilePath: process.env.NODE_ENV === 'development' ? '.env.dev' : '.env',
			load: [databaseConfig],
			cache: true,
			expandVariables: true,
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				uri: configService.get<string>('DATABASE_URI'),
				dbName: configService.get<string>('DATABASE_NAME'),
			}),
			inject: [ConfigService],
		}),

		EmailModule,
		AuthModule,
		UserModule,
		TokenModule,
		ImgurModule,
		RoomTypeModule,
		RoomModule,
		ServiceTypeModule,
		ServiceModule,
		PromotionModule,
		ReportModule,
		RatingModule,
		BookingModule,
		InvoiceModule,
		AdminDashboardModule,
		RoomServiceModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_FILTER,
			useClass: GlobalExceptionFilter,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: TransformInterceptor,
		},
	],
})
export class AppModule {}
