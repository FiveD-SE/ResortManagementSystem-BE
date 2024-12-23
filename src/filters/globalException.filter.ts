import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(GlobalExceptionFilter.name);
	constructor(private readonly config_service: ConfigService) {}
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const status =
			exception instanceof HttpException ? exception.getStatus() : 500;

		const message =
			exception instanceof HttpException
				? exception.message
				: 'Internal server error';
		this.logger.error(exception);
		console.error(exception);
		response.status(status).json({
			statusCode: status,
			message,
			error:
				this.config_service.get('NODE_ENV') !== 'production'
					? {
							response: exception.response,
							stack: exception.stack,
						}
					: null,
		});
	}
}
