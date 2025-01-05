import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Token, TokenDocument, TokenType } from './entities/token.entity';
import { SignTokenWithSecretInterface } from './interfaces/token.interface';

@Injectable()
export class TokenService {
	constructor(
		private readonly jwtService: JwtService,
		@InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
	) {}

	signJwtWithSecret({
		payload,
		secret,
		exp,
	}: SignTokenWithSecretInterface): string {
		return this.jwtService.sign(payload, {
			secret,
			expiresIn: exp,
		});
	}

	async verifyJwtWithSecret(token: string, secret: string): Promise<boolean> {
		try {
			await this.jwtService.verifyAsync(token, { secret });
			return true;
		} catch {
			return false;
		}
	}

	signJwt(payload: object, exp: string): string {
		return this.jwtService.sign(payload, {
			expiresIn: exp,
		});
	}

	async verifyJwt(token: string): Promise<boolean> {
		try {
			await this.jwtService.verify(token);
			return true;
		} catch {
			return false;
		}
	}

	async storeToken(
		userId: string,
		token: string,
		type: TokenType,
	): Promise<void> {
		const newToken = new this.tokenModel({ userId, token, type });
		await newToken.save();
	}

	async findToken(userId: string, type: TokenType): Promise<TokenDocument> {
		return this.tokenModel.findOne({ userId, type }).exec();
	}

	async deleteToken(userId: string, type: TokenType): Promise<void> {
		await this.tokenModel.deleteOne({ userId, type }).exec();
	}
}
