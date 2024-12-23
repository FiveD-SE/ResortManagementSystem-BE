import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { commonKeyPair } from '@/constraints/jwt.constraints';

@Module({
	imports: [
		JwtModule.register({
			privateKey: commonKeyPair.privateKey,
			publicKey: commonKeyPair.publicKey,
		}),
	],
	providers: [TokenService],
	exports: [TokenService],
})
export class TokenModule {}
