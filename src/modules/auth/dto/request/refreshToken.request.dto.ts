import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenRequestDTO {
	@IsNotEmpty()
	@IsString()
	refreshToken: string;

	@IsNotEmpty()
	@IsString()
	userId: string;
}
