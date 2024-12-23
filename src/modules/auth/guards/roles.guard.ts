import { ROLES } from '@/decorators/roles.decorator';
import { RequestWithUser } from '@/types/request.type';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(
		context: ExecutionContext,
	): boolean | Promise<boolean> | Observable<boolean> {
		const roles: string[] = this.reflector.getAllAndOverride<string[]>(ROLES, [
			context.getHandler(),
			context.getClass(),
		]);

		if (!roles) {
			return true;
		}

		const request: RequestWithUser = context.switchToHttp().getRequest();
		const userRole = request.user?.role;

		if (!userRole) {
			return false;
		}

		return roles.includes(userRole);
	}
}
