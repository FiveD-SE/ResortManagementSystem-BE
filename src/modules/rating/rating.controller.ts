import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { RatingService } from './rating.service';
import { CreateRatingDTO } from './dto/createRating.request';
import { JwtAccessTokenGuard } from '../auth/guards/jwt-access-token.guard';

@Controller('rooms/:roomId/ratings')
export class RatingController {
	constructor(private readonly ratingService: RatingService) {}

	@UseGuards(JwtAccessTokenGuard)
	@Post()
	async createRating(
		@Param('roomId') roomId: string,
		@Req() req,
		@Body() createRatingDto: CreateRatingDTO,
	) {
		const userId = req.user.id;
		return this.ratingService.addRating(roomId, userId, createRatingDto);
	}
}
