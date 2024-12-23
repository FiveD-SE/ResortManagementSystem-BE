import { JwtAccessTokenGuard } from '@/modules/auth/guards/jwt-access-token.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { UserRole } from '@/modules/user/entities/user.entity';
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Roles } from './roles.decorator';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export function OnlyAdmin() {
	return applyDecorators(
		UseGuards(JwtAccessTokenGuard),
		UseGuards(RolesGuard),
		Roles(UserRole.Admin),
	);
}
