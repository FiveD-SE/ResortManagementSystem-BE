import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserPromotionService } from './userPromotion.service';
import { UserPromotion } from './entities/userPromotion.entity';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('user-promotions')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class UserPromotionController {
	constructor(private readonly userPromotionService: UserPromotionService) {}

	@Get()
	@Roles(UserRole.Admin)
	async getAllUserPromotions(): Promise<UserPromotion[]> {
		return this.userPromotionService.getAllUserPromotions();
	}

	@Get(':userId')
	async getUserPromotionByUserId(
		@Param('userId') userId: string,
	): Promise<UserPromotion> {
		return this.userPromotionService.getUserPromotionByUserId(userId);
	}
}
