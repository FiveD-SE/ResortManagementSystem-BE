import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { commonKeyPair } from '@/constraints/jwt.constraints';
import { Token, TokenSchema } from './entities/token.entity';

@Module({
	imports: [
		JwtModule.register({
			privateKey: commonKeyPair.privateKey,
			publicKey: commonKeyPair.publicKey,
		}),
		MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
	],
	providers: [TokenService],
	exports: [TokenService],
})
export class TokenModule {}
