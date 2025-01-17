import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

import metadata from '../metadata';

export async function configSwagger(app: INestApplication) {
	if (process.env.SWAGGER_ENABLED !== 'true') {
		return;
	}

	const config = new DocumentBuilder()
		.setTitle('Resort Management System')
		.setDescription('The Resort Management System API description')
		.setVersion('1.0')
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
			},
			'jwt',
		)
		.addSecurityRequirements('jwt')
		.build();
	await SwaggerModule.loadPluginMetadata(metadata);
	const document = SwaggerModule.createDocument(app, config);
	const theme = new SwaggerTheme();

	SwaggerModule.setup('api-docs', app, document, {
		swaggerOptions: { persistAuthorization: true },
		customCss: theme.getBuffer(SwaggerThemeNameEnum.FLATTOP),
	});
}
