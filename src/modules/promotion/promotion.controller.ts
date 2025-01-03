import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	UseGuards,
	Req,
	Query,
	BadRequestException,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionRequestDto } from './dto/createPromotion.request.dto';
import { Promotion } from './entities/promotion.entity';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RequestWithUser } from '@/types/request.type';
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';

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
	@ApiPaginationQuery()
	@ApiOperation({
		summary: 'Get all promotions with pagination and sorting',
	})
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['promotionName', 'amount', 'createdAt', 'updatedAt'],
		description: 'Field to sort by',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: SortOrder,
		description: 'Sort order (asc/desc)',
	})
	async getAllPromotions(
		@Req() req: RequestWithUser,
		@Query() query: PaginateParams,
	): Promise<PaginateData<Promotion>> {
		const { user } = req;
		const validSortFields = [
			'promotionName',
			'amount',
			'createdAt',
			'updatedAt',
		];

		if (query.sortBy && !validSortFields.includes(query.sortBy)) {
			throw new BadRequestException(
				`Sort field must be one of: ${validSortFields.join(', ')}`,
			);
		}

		return this.promotionService.getAllPromotions(user.role, user.id, query);
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
