import { UserService } from '@/modules/user/user.service';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../interfaces/token.interface';
import { accessTokenKeyPair } from '@/constraints/jwt.constraints';

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly userService: UserService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: true,
			secretOrKey: accessTokenKeyPair.publicKey,
		});
	}

	async validate(payload: TokenPayload) {
		return await this.userService.findByID(payload.userID);
	}
}
