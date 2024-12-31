import { OnlyAdmin } from '@/decorators/auth.decorator';
import MongooseClassSerializerInterceptor from '@/interceptors/mongooseClassSerializer.interceptor';
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Query,
	UseInterceptors,
} from '@nestjs/common';
import { UpdateUserRequestDTO } from './dto/request/updateUser.request.dto';
import { User, UserRole } from './entities/user.entity';
import { UserManagerService } from './userManager.service';
import {
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ApiPaginationQuery } from '@/decorators/apiPaginationQuery.decorator';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { Roles } from '@/decorators/roles.decorator';
@UseInterceptors(MongooseClassSerializerInterceptor(User))
@Controller('admin/users')
@ApiTags('User')
@OnlyAdmin()
export class UserManagerController {
	constructor(private readonly userManagerService: UserManagerService) {}
	@Get('staff-count')
	@Roles(UserRole.Admin)
	@ApiOperation({
		summary: 'Get count of staff',
	})
	@ApiResponse({
		status: 200,
		description: 'Count of staff',
		schema: {
			type: 'object',
			properties: {
				total: { type: 'number' },
				receptionist: { type: 'number' },
				service_staff: { type: 'number' },
			},
		},
	})
	async getStaffCount(): Promise<{
		total: number;
		receptionist: number;
		service_staff: number;
	}> {
		return this.userManagerService.getStaffCount();
	}

	@Get(':role')
	@ApiPaginationQuery()
	@OnlyAdmin()
	@ApiOperation({
		summary: 'Get all user by role with pagination and sorting',
	})
	@ApiParam({
		name: 'role',
		required: false,
		enum: ['admin', 'user', 'service_staff', 'receptionist', 'staff'],
		description: 'Role of user',
	})
	@ApiQuery({
		name: 'sortBy',
		required: false,
		enum: ['firstName', 'lastName', 'isActive', 'createdAt', 'updatedAt'],
		description: 'Field to sort by',
	})
	@ApiQuery({
		name: 'sortOrder',
		required: false,
		enum: SortOrder,
		description: 'Sort order (asc/desc)',
	})
	findAllWithPagination(
		@Param('role') role: string,
		@Query() query: PaginateParams,
	): Promise<PaginateData<User>> {
		const validSortFields = [
			'firstName',
			'lastName',
			'isActive',
			'createdAt',
			'updatedAt',
		];

		const validRole = [
			'admin',
			'user',
			'service_staff',
			'receptionist',
			'staff',
		];

		if (query.sortBy && !validSortFields.includes(query.sortBy)) {
			throw new BadRequestException(
				`Sort field must be one of: ${validSortFields.join(', ')}`,
			);
		}

		if (role && !validRole.includes(role)) {
			throw new BadRequestException(
				`Role must be one of: ${validRole.join(', ')}`,
			);
		}
		return this.userManagerService.findAllWithPagination(query, role);
	}

	@Patch(':userID')
	@Roles(UserRole.Admin)
	@ApiOperation({
		summary: 'Update user information',
	})
	@ApiParam({
		name: 'userID',
		required: true,
		description: 'ID of the user to update',
	})
	@ApiBody({ type: UpdateUserRequestDTO })
	updateUser(
		@Param('userID') userID: string,
		@Body() dto: UpdateUserRequestDTO,
	): Promise<User> {
		return this.userManagerService.updateUser(userID, dto);
	}

	@Delete(':userID')
	@Roles(UserRole.Admin)
	@ApiOperation({
		summary: 'Delete user',
	})
	@ApiParam({
		name: 'userID',
		required: true,
		description: 'ID of the user to delete',
	})
	deleteUser(@Param('userID') userID: string): Promise<void> {
		return this.userManagerService.deleteUser(userID);
	}
}
