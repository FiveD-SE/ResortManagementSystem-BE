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
	@Roles(UserRole.Admin)
	async getAllPromotions(): Promise<Promotion[]> {
		return this.promotionService.getAllPromotions();
	}

	@Get(':id')
	@Roles(UserRole.Admin)
	async getPromotionById(@Param('id') id: string): Promise<Promotion> {
		return this.promotionService.getPromotionById(id);
	}

	@Delete(':id')
	@Roles(UserRole.Admin)
	async deletePromotion(@Param('id') id: string): Promise<void> {
		return this.promotionService.deletePromotion(id);
	}
}
