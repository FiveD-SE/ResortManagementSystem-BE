import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	UseGuards,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionRequestDto } from './dto/createPromotion.request.dto';
import { Promotion } from './entities/promotion.entity';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { CurrentUser } from '@/decorators/currentUser.decorator';

@Controller('promotions')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class PromotionController {
	constructor(private readonly promotionService: PromotionService) {}

	@Post()
	@Roles(UserRole.Admin)
	async createPromotion(
		@Body() createPromotionDto: CreatePromotionRequestDto,
	): Promise<Promotion> {
		return this.promotionService.createPromotion(createPromotionDto);
	}

	@Get()
	async getAllPromotions(@CurrentUser() user: any): Promise<Promotion[]> {
		return this.promotionService.getAllPromotions(user.role, user.id);
	}

	@Get(':id')
	async getPromotionById(@Param('id') id: string): Promise<Promotion> {
		return this.promotionService.getPromotionById(id);
	}

	@Delete(':id')
	@Roles(UserRole.Admin)
	async deletePromotion(@Param('id') id: string): Promise<void> {
		return this.promotionService.deletePromotion(id);
	}
}
