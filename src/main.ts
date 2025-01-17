import { NestFactory } from '@nestjs/core';
import {
	BadRequestException,
	ValidationPipe,
	Logger as AppLogger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { configSwagger } from './configs/apiDocs.config';

async function bootstrap() {
	const logger = new AppLogger(bootstrap.name);

	const app = await NestFactory.create(AppModule, { bufferLogs: true });

	configSwagger(app);
	const configService = app.get(ConfigService);
	app.useGlobalPipes(
		new ValidationPipe({
			transform: true,
			whitelist: true,
			forbidNonWhitelisted: true,
			transformOptions: { enableImplicitConversion: true },
			exceptionFactory: (errors) => {
				const result =
					errors[0].constraints[Object.keys(errors[0].constraints)[0]];
				return new BadRequestException(result);
			},
		}),
	);

	app.enableCors({
		origin: [
			'http://localhost:3000',
			'http://localhost:5173',
			configService.get<string>('FRONTEND_URL'),
		],
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		credentials: true,
	});

	await app.listen(configService.get('PORT'), () => {
		logger.log(
			`Server running on http://localhost:${configService.get('PORT')}`,
		);
		logger.log(
			`API Docs http://localhost:${configService.get('PORT')}/api-docs`,
		);
	});
}
bootstrap();
