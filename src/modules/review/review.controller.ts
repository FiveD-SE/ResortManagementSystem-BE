import {
	Controller,
	Get,
	Post,
	Delete,
	Param,
	Body,
	Query,
	UseGuards,
	Req,
} from '@nestjs/common';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '@/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RequestWithUser } from '@/types/request.type';
import { ReviewService } from './review.service';
import { CreateReviewRequestDto } from './dto/createReview.request.dto';
import { RoomReview } from './entities/roomReview.entity';
import { ServiceReview } from './entities/serviceReview.entity';
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { PaginateData, PaginateParams } from '@/types/common.type';

@Controller('reviews')
@UseGuards(JwtAccessTokenGuard, RolesGuard)
export class ReviewController {
	constructor(private readonly reviewService: ReviewService) {}

	@Post()
	async createReviews(
		@Body() createReviewRequestDto: CreateReviewRequestDto,
		@Req() req: RequestWithUser,
	): Promise<{ roomReview: RoomReview; serviceReviews: ServiceReview[] }> {
		const { user } = req;
		return this.reviewService.createReview(user.id, createReviewRequestDto);
	}

	@Get()
	@ApiPaginationQuery()
	async getAllRoomReviews(
		@Query() query: PaginateParams,
	): Promise<PaginateData<RoomReview>> {
		return this.reviewService.getAllRoomReview(query);
	}

	@Get('user')
	@ApiPaginationQuery()
	async getReviewByUserId(
		@Req() req: RequestWithUser,
		@Query() query: PaginateParams,
	): Promise<PaginateData<RoomReview>> {
		const { user } = req;
		return this.reviewService.getRoomReviewByUserId(user.id, query);
	}

	@Get(':roomId')
	@ApiPaginationQuery()
	async getRoomReviewsByRoomId(
		@Param('roomId') roomId: string,
		@Query() query: PaginateParams,
	): Promise<PaginateData<RoomReview>> {
		return this.reviewService.getRoomReviewByRoomId(roomId, query);
	}

	@Get('rooms/:roomId/average-rating')
	async getAverageRoomRating(@Param('roomId') roomId: string): Promise<number> {
		return this.reviewService.getAverageRatingRoomReview(roomId);
	}

	@Get('services/average-rating')
	async getAverageServiceRating(
		@Query('serviceIds') serviceIds: string[],
	): Promise<{ serviceId: string; averageRating: number }[]> {
		const ids = Array.isArray(serviceIds) ? serviceIds : [serviceIds];

		const serviceRatings =
			await this.reviewService.getAverageRatingServiceReview(ids);
		return serviceRatings;
	}

	@Delete(':id')
	@Roles(UserRole.Admin)
	async remove(@Param('id') id: string): Promise<void> {
		return this.reviewService.remove(id);
	}
}
