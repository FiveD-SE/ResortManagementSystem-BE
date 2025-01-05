import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { UserPromotionService } from './userPromotion.service';
import { UserPromotion } from './entities/userPromotion.entity';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { UsePromotionDto } from './dto/usePromotion.request.dto';
import { RequestWithUser } from '@/types/request.type';

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
		@Req() req: RequestWithUser,
	): Promise<UserPromotion> {
		const userId = req.user.id;
		return this.userPromotionService.getUserPromotionHistoryByUserId(userId);
	}

	@Post('use-promotion')
	async usePromotion(
		@Req() req: RequestWithUser,
		@Body() usePromotionDto: UsePromotionDto,
	): Promise<UserPromotion> {
		const { user } = req;
		return this.userPromotionService.usePromotion(
			user.id,
			usePromotionDto.promotionId,
		);
	}
}
