import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserPromotionService } from './userPromotion.service';
import { UserPromotion } from './entities/userPromotion.entity';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { CurrentUser } from '@/decorators/currentUser.decorator';
import { UsePromotionDto } from './dto/usePromotion.request.dto';

@Controller('user-promotions')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class UserPromotionController {
	constructor(private readonly userPromotionService: UserPromotionService) {}

	@Get()
	@Roles(UserRole.Admin)
	async getAllUserPromotions(): Promise<UserPromotion[]> {
		return this.userPromotionService.getAllUserPromotions();
	}

	@Get('get-history')
	async getUserPromotionHistoryByUserId(
		@CurrentUser('id') userId: string,
	): Promise<UserPromotion> {
		return this.userPromotionService.getUserPromotionHistoryByUserId(userId);
	}

	@Post('use-promotion')
	async usePromotion(
		@CurrentUser('id') userId: string,
		@Body() usePromotionDto: UsePromotionDto,
	): Promise<UserPromotion> {
		return this.userPromotionService.usePromotion(
			userId,
			usePromotionDto.promotionId,
		);
	}
}
