import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { SendEmailDto } from './dto/sendEmail.dto';

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class EmailController {
	constructor(private readonly emailService: EmailService) {}

	@Post('send')
	@Roles(UserRole.Admin)
	@ApiOperation({ summary: 'Send an email' })
	@ApiResponse({
		status: 201,
		description: 'The email has been successfully sent.',
	})
	@ApiResponse({ status: 400, description: 'Bad Request' })
	async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<void> {
		await this.emailService.sendEmail(sendEmailDto);
	}
}
