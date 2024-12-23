import {
	accessTokenKeyPair,
	refreshTokenKeyPair,
} from '@/constraints/jwt.constraints';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../email/email.service';
import { TokenService } from '../token/token.service';
import { ChangePasswWordRequestDto } from './dto/request/changePassword.request.dto';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { RegisterRequestDTO } from './dto/request/register.request.dto';
import { ResetPasswordRequestDTO } from './dto/request/resetPassword.request.dto';
import { VerifyAccountRequestDTO } from './dto/request/verifyAccount.request.dto';
import { LoginResponseDTO } from './dto/response/login.response.dto';
import {
	ResetPasswordTokenPayload,
	TokenPayload,
	VerifyAccountTokenPayload,
} from './interfaces/token.interface';
import { TokenType } from '../token/entities/token.entity';

@Injectable()
export class AuthService {
	private readonly SALT_ROUND = 10;
	private readonly FORGOT_PASSWORD_EXPIRATION_TIME = '15mins';
	private readonly VERIFY_ACCOUNT_EXPIRATION_TIME = '15mins';
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private readonly userService: UserService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly tokenService: TokenService,
		private readonly emailService: EmailService,
	) {}

	private async verifyPlainContentWithHashedContent(
		plainText: string,
		hashedText: string,
	): Promise<boolean> {
		return await bcrypt.compare(plainText, hashedText);
	}

	async changePassword(
		userID: string,
		dto: ChangePasswWordRequestDto,
	): Promise<void> {
		const user = await this.userService.getUser(userID);

		const isMatching = await bcrypt.compare(dto.oldPassword, user.password);

		if (!isMatching) {
			throw new BadRequestException('Old password is incorrect');
		}
		const hashedPassword = await bcrypt.hash(dto.newPassword, this.SALT_ROUND);

		await this.userService.update(userID, {
			password: hashedPassword,
		});
	}

	async register(dto: RegisterRequestDTO): Promise<void> {
		const isExist = await this.userService.findOne({ email: dto.email });
		if (isExist) {
			throw new BadRequestException('Email already exists');
		}

		const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUND);

		const newUser = await this.userService.create({
			...dto,
			password: hashedPassword,
		});

		this.sendVerificationEmail(newUser.email);
	}

	async login(userID: string): Promise<LoginResponseDTO> {
		const accessToken = this.generateAccessToken({
			userID,
		});
		const refreshToken = this.generateRefreshToken({
			userID,
		});
		await this.storeRefreshToken(userID, refreshToken);
		return { accessToken, refreshToken };
	}

	async getAuthenticatedUser(email: string, password: string): Promise<User> {
		const user = await this.userService.findOne({ email });
		if (!user) {
			throw new BadRequestException('User not found');
		}
		const isMatching = await this.verifyPlainContentWithHashedContent(
			password,
			user.password,
		);

		if (!isMatching) {
			throw new BadRequestException('Password is incorrect');
		}

		return user;
	}

	async getUserIfRefreshTokenMatched(
		userId: string,
		refreshToken: string,
	): Promise<User> {
		const token = await this.tokenService.findToken(
			userId,
			TokenType.RefreshToken,
		);
		if (!token) {
			throw new BadRequestException('Invalid Token');
		}

		const isMatching = await bcrypt.compare(refreshToken, token.token);
		if (!isMatching) {
			throw new BadRequestException('Invalid Token');
		}
		return this.userService.findByID(userId);
	}

	generateAccessToken(payload: TokenPayload): string {
		return this.jwtService.sign(payload, {
			algorithm: 'RS256',
			privateKey: accessTokenKeyPair.privateKey,
			expiresIn: `${this.configService.get<string>(
				'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
			)}s`,
		});
	}

	generateRefreshToken(payload: TokenPayload): string {
		return this.jwtService.sign(payload, {
			algorithm: 'RS256',
			privateKey: refreshTokenKeyPair.privateKey,
			expiresIn: `${this.configService.get<string>(
				'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
			)}s`,
		});
	}

	async storeRefreshToken(userId: string, token: string): Promise<void> {
		const hashedToken = await bcrypt.hash(token, this.SALT_ROUND);
		await this.tokenService.storeToken(
			userId,
			hashedToken,
			TokenType.RefreshToken,
		);
	}

	async forgotPassword(email: string): Promise<void> {
		const user = await this.userService.getUser(email);
		const payload: ResetPasswordTokenPayload = {
			email,
		};

		const resetPasswordToken = await this.tokenService.signJwtWithSecret({
			payload,
			secret: user.password,
			exp: this.FORGOT_PASSWORD_EXPIRATION_TIME,
		});

		await this.tokenService.storeToken(
			user.id,
			resetPasswordToken,
			TokenType.ResetPassword,
		);
		await this.emailService.sendUserResetPasswordEmail(
			email,
			resetPasswordToken,
		);
	}

	async resetPassword(dto: ResetPasswordRequestDTO): Promise<void> {
		const decoded = await this.jwtService.decode(dto.token);
		const user = await this.userService.findOne({ email: decoded.email });
		if (!user) {
			throw new BadRequestException('User not found');
		}

		const isValidToken = await this.tokenService.verifyJwtWithSecret(
			dto.token,
			user.password,
		);

		if (!isValidToken) {
			throw new BadRequestException('Invalid token');
		}

		const hashedPassword = await bcrypt.hash(dto.newPassword, this.SALT_ROUND);
		await this.userService.update(user.id, { password: hashedPassword });
		await this.tokenService.deleteToken(user.id, TokenType.ResetPassword);
	}

	async verifyAccount(dto: VerifyAccountRequestDTO): Promise<void> {
		const decoded = await this.jwtService.decode(dto.token);
		const user = await this.userService.getUser(decoded.email);

		if (user.isVerified) {
			throw new BadRequestException('Account already verifed');
		}

		const isValidToken = await this.tokenService.verifyJwtWithSecret(
			dto.token,
			user.password + user.isVerified,
		);

		if (!isValidToken) {
			throw new BadRequestException('Invalid token');
		}

		await this.userService.update(user.id, { isVerified: true });
	}

	async sendVerificationEmail(email: string): Promise<void> {
		const user = await this.userService.getUser(email);

		if (user.isVerified) {
			throw new BadRequestException('Account already verifed');
		}

		const payload: VerifyAccountTokenPayload = {
			email,
		};

		const verifyToken = await this.tokenService.signJwtWithSecret({
			payload,
			secret: user.password + user.isVerified,
			exp: this.VERIFY_ACCOUNT_EXPIRATION_TIME,
		});

		await this.emailService.sendUserVerifyEmail(email, verifyToken);
	}

	async loginWithGoogle(user: any) {
		let existingUser = await this.userService.findOne({ email: user.email });
		if (!existingUser) {
			const defaultPassword = await bcrypt.hash(
				'defaultPassword',
				this.SALT_ROUND,
			);
			existingUser = await this.userService.create({
				email: user.email,
				firstName: user.firstName || 'DefaultFirstName',
				lastName: user.lastName || 'DefaultLastName',
				password: defaultPassword,
			});
		}

		const accessToken = this.generateAccessToken({
			userID: existingUser.id,
		});

		const refreshToken = this.generateRefreshToken({
			userID: existingUser.id,
		});

		await this.storeRefreshToken(existingUser.id, refreshToken);

		return { accessToken, refreshToken };
	}
}
