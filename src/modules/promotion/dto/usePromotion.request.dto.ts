import { IsString, IsNotEmpty } from 'class-validator';

export class UsePromotionDto {
	@IsString()
	@IsNotEmpty()
	promotionId: string;
}
