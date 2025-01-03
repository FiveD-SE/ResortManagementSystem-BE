import { BaseServiceAbstract } from '@/services/base/base.abstract.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { User, UserDocument, UserRole } from './entities/user.entity';
import { UserRepositoryInterface } from './interfaces/user.interface';
import { UpdateUserRequestDTO } from './dto/request/updateUser.request.dto';
import { UserService } from './user.service';
import { PaginateData, PaginateParams, SortOrder } from '@/types/common.type';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class UserManagerService extends BaseServiceAbstract<User> {
	constructor(
		@Inject('UsersRepositoryInterface')
		private readonly userRepo: UserRepositoryInterface,
		private readonly userService: UserService,
		@InjectModel(User.name)
		private readonly userModel: Model<UserDocument>,
	) {
		super(userRepo);
	}

	async updateUser(id: string, dto: UpdateUserRequestDTO): Promise<User> {
		if (!Types.ObjectId.isValid(id)) {
			throw new BadRequestException('Invalid ID format');
		}

		const existingUser = await this.userService.getUser(id);

		if (!existingUser) {
			throw new BadRequestException('User not found');
		}

		const updateDto: any = { ...dto };

		if (dto.role === UserRole.Service_Staff) {
			if (!dto.serviceTypeId) {
				throw new BadRequestException(
					'ServiceTypeId is required for service_staff role.',
				);
			}
			if (!Types.ObjectId.isValid(dto.serviceTypeId)) {
				throw new BadRequestException('Invalid ID format');
			}

			updateDto.serviceTypeId = new Types.ObjectId(dto.serviceTypeId);
		} else {
			updateDto.serviceTypeId = undefined;
		}

		const updatedUser = await this.update(id, updateDto);

		if (updatedUser.role !== UserRole.Service_Staff) {
			await this.userModel
				.updateOne({ _id: id }, { $unset: { serviceTypeId: '' } })
				.exec();
		}

		if (updatedUser.serviceTypeId) {
			(updatedUser as any).serviceTypeId = updatedUser.serviceTypeId.toString();
		}

		return updatedUser;
	}

	async findAllWithPagination(
		params: PaginateParams,
		role: string,
	): Promise<PaginateData<User>> {
		const {
			page = 1,
			limit = 10,
			sortBy = 'createdAt',
			sortOrder = SortOrder.DESC,
		} = params;

		const skip = (page - 1) * limit;
		const sortOptions: Record<string, 1 | -1> = {
			[sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
		};

		let query = {};
		if (role) {
			if (role === 'staff') {
				query = { role: { $in: ['receptionist', 'service_staff'] } };
			} else {
				query = { role };
			}
		}

		const [count, users] = await Promise.all([
			this.userModel.countDocuments(query).exec(),
			this.userModel
				.find(query)
				.sort(sortOptions as any)
				.skip(skip)
				.limit(limit)
				.exec(),
		]);

		users.forEach((user) => {
			if (user.serviceTypeId) {
				(user as any).serviceTypeId = user.serviceTypeId.toString();
			}
		});

		const totalPages = Math.ceil(count / limit);

		return {
			docs: users,
			totalDocs: count,
			page,
			limit,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			nextPage: page < totalPages ? page + 1 : null,
			prevPage: page > 1 ? page - 1 : null,
			pagingCounter: skip + 1,
		};
	}

	async deleteUser(id: string): Promise<void> {
		const user = await this.userService.getUser(id);
		if (!user) {
			throw new Error('User not found');
		}
		await this.userModel.deleteOne({ _id: id }).exec();
	}

	async getStaffCount(): Promise<{
		total: number;
		receptionist: number;
		service_staff: number;
	}> {
		const [total, receptionist, serviceStaff] = await Promise.all([
			this.userModel
				.countDocuments({ role: { $in: ['receptionist', 'service_staff'] } })
				.exec(),
			this.userModel.countDocuments({ role: 'receptionist' }).exec(),
			this.userModel.countDocuments({ role: 'service_staff' }).exec(),
		]);

		return {
			total,
			receptionist,
			service_staff: serviceStaff,
		};
	}

	async exportUsersToExcel(res: Response): Promise<void> {
		const users = await this.userModel.find({ role: 'user' }).exec();

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Users');

		worksheet.columns = [
			{ header: 'User ID', key: 'id', width: 30 },
			{ header: 'Name', key: 'name', width: 25 },
			{ header: 'Email', key: 'email', width: 30 },
			{ header: 'Phone Number', key: 'phone', width: 20 },
			{ header: 'Status', key: 'status', width: 20 },
		];

		users.forEach((user) => {
			worksheet.addRow({
				id: user._id.toString(),
				name: user.firstName + ' ' + user.lastName,
				email: user.email,
				phone: user.phoneNumber ? user.phoneNumber : 'N/A',
				status: user.isActive ? 'Active' : 'Inactive',
			});
		});

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
		await workbook.xlsx.write(res);
		res.end();
	}

	async exportStaffToExcel(res: Response): Promise<void> {
		const serviceStaff = await this.userModel
			.find({ role: 'service_staff' })
			.exec();
		const receptionist = await this.userModel
			.find({ role: 'receptionist' })
			.exec();
		const allStaff = [...serviceStaff, ...receptionist];

		const workbook = new ExcelJS.Workbook();

		const allStaffSheet = workbook.addWorksheet('All Staff');
		allStaffSheet.columns = [
			{ header: 'Staff ID', key: 'id', width: 30 },
			{ header: 'Name', key: 'name', width: 25 },
			{ header: 'Email', key: 'email', width: 30 },
			{ header: 'Role', key: 'role', width: 20 },
			{ header: 'Status', key: 'status', width: 20 },
		];
		allStaff.forEach((staff) => {
			allStaffSheet.addRow({
				id: staff._id.toString(),
				name: staff.firstName + ' ' + staff.lastName,
				email: staff.email,
				role: staff.role === 'receptionist' ? 'Receptionist' : 'Service Staff',
				status: staff.isActive ? 'Active' : 'Inactive',
			});
		});

		const serviceStaffSheet = workbook.addWorksheet('Service Staff');
		serviceStaffSheet.columns = [
			{ header: 'Staff ID', key: 'id', width: 30 },
			{ header: 'Name', key: 'name', width: 25 },
			{ header: 'Email', key: 'email', width: 30 },
			{ header: 'Role', key: 'role', width: 20 },
			{ header: 'Status', key: 'status', width: 20 },
		];
		serviceStaff.forEach((staff) => {
			serviceStaffSheet.addRow({
				id: staff._id.toString(),
				name: staff.firstName + ' ' + staff.lastName,
				email: staff.email,
				role: 'Service Staff',
				status: staff.isActive ? 'Active' : 'Inactive',
			});
		});

		const receptionistSheet = workbook.addWorksheet('Receptionist');
		receptionistSheet.columns = [
			{ header: 'Staff ID', key: 'id', width: 30 },
			{ header: 'Name', key: 'name', width: 25 },
			{ header: 'Email', key: 'email', width: 30 },
			{ header: 'Role', key: 'role', width: 20 },
			{ header: 'Status', key: 'status', width: 20 },
		];
		receptionist.forEach((staff) => {
			receptionistSheet.addRow({
				id: staff._id.toString(),
				name: staff.firstName + ' ' + staff.lastName,
				email: staff.email,
				role: 'Receptionist',
				status: staff.isActive ? 'Active' : 'Inactive',
			});
		});

		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		);
		res.setHeader('Content-Disposition', 'attachment; filename=staff.xlsx');
		await workbook.xlsx.write(res);
		res.end();
	}
}
