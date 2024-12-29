import { ApiPost } from '@/decorators/apiPost.decorator';
import { RequestWithUser } from '@/types/request.type';
import {
	Body,
	Controller,
	Get,
	Req,
	Res,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordRequestDTO } from './dto/request/forgotPassword.request.dto';
import { LoginRequestDTO } from './dto/request/login.request.dto';
import { RefreshTokenRequestDTO } from './dto/request/refreshToken.request.dto';
import { RegisterRequestDTO } from './dto/request/register.request.dto';
import { ResetPasswordRequestDTO } from './dto/request/resetPassword.request.dto';
import { SendEmailVerfiyRequestDTO } from './dto/request/sendEmailVerify.request.dto';
import { VerifyAccountRequestDTO } from './dto/request/verifyAccount.request.dto';
import { LoginResponseDTO } from './dto/response/login.response.dto';
import { JwtAccessTokenGuard } from './guards/jwt-access-token.guard';
import { JwtRefreshTokenGuard } from './guards/jwt-refresh-token.guard';
import { LocalAuthGuard } from './guards/local.guard';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import MongooseClassSerializerInterceptor from '@/interceptors/mongooseClassSerializer.interceptor';
import { User } from '../user/entities/user.entity';
import { ChangePasswWordRequestDto } from './dto/request/changePassword.request.dto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('auth')
@UseInterceptors(MongooseClassSerializerInterceptor(User))
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
		private readonly configService: ConfigService,
	) {}

	@ApiPost({
		path: 'register',
		responseMessage:
			'User registered successfully. Please check your email to verify your account',
	})
	@ApiBody({ type: RegisterRequestDTO })
	async register(@Body() dto: RegisterRequestDTO) {
		return await this.authService.register(dto);
	}

	@UseGuards(LocalAuthGuard)
	@ApiBody({
		type: LoginRequestDTO,
		examples: {
			admin: {
				value: {
					email: 'admin@example.com',
					password: 'Example@123',
				} as LoginRequestDTO,
			},
			user: {
				value: {
					email: 'user@example.com',
					password: 'Example@123',
				} as LoginRequestDTO,
			},
			receptionist: {
				value: {
					email: 'receptionist@example.com',
					password: 'Example@123',
				} as LoginRequestDTO,
			},
			service_staff_SkincareService: {
				value: {
					email: 'service@example.com',
					password: 'Example@123',
				} as LoginRequestDTO,
			},
			service_staff_BasicService: {
				value: {
					email: 'servicestaff@example.com',
					password: 'Example@123',
				} as LoginRequestDTO,
			},
		},
	})
	@ApiOkResponse({
		description: 'Login successful',
		type: LoginResponseDTO,
	})
	@ApiPost({ path: 'login' })
	async login(@Req() request: RequestWithUser) {
		const { user } = request;
		return await this.authService.login(user._id.toString());
	}

	@UseGuards(JwtAccessTokenGuard)
	@Get('me')
	async getMe(@Req() request: RequestWithUser) {
		const { user } = request;

		return await this.userService.getUser(user.email);
	}

	@UseGuards(JwtRefreshTokenGuard)
	@ApiPost({ path: 'refresh-token' })
	@ApiBody({
		type: RefreshTokenRequestDTO,
	})
	async refreshAccessToken(@Req() request: RequestWithUser) {
		const { user } = request;
		const accessToken = this.authService.generateAccessToken({
			userID: user._id.toString(),
		});
		return {
			accessToken,
		};
	}

	@ApiPost({ path: 'reset-password' })
	async resetPassword(@Body() dto: ResetPasswordRequestDTO) {
		return await this.authService.resetPassword(dto);
	}

	@ApiPost({ path: 'change-my-password' })
	@UseGuards(JwtAccessTokenGuard)
	async changePassword(
		@Req() req: RequestWithUser,
		@Body() dto: ChangePasswWordRequestDto,
	) {
		return await this.authService.changePassword(req.user._id.toString(), dto);
	}

	@ApiPost({ path: 'verify-account' })
	async verifyAccount(@Body() dto: VerifyAccountRequestDTO) {
		return await this.authService.verifyAccount(dto);
	}

	@ApiPost({ path: '/email/forgot-password' })
	async forgotPassword(@Body() dto: ForgotPasswordRequestDTO) {
		return await this.authService.forgotPassword(dto.email);
	}

	@ApiPost({ path: '/email/verify-account' })
	async sendEmailVerify(@Body() dto: SendEmailVerfiyRequestDTO) {
		return await this.authService.sendVerificationEmail(dto.email);
	}

	@Get('google')
	@UseGuards(AuthGuard('google'))
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async googleAuth(@Req() req) {
		// Initiates the Google OAuth2 login flow
	}

	@Get('google/redirect')
	@UseGuards(AuthGuard('google'))
	async googleAuthRedirect(@Req() req, @Res() res: Response) {
		const { accessToken, refreshToken } =
			await this.authService.loginWithGoogle(req.user);
		const frontendUrl = this.configService.get<string>('FRONTEND_URL');
		res.redirect(
			`${frontendUrl}/third-party?accessToken=${accessToken}&refreshToken=${refreshToken}`,
		);
	}
}
