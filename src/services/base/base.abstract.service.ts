import { BaseEntity } from '@modules/shared/base/base.entity';
import { FindAllResponse } from 'src/types/common.type';

import { BaseServiceInterface } from './base.interface.service';
import { BaseRepositoryInterface } from '@/repositories/base/base.interface.repo';

export abstract class BaseServiceAbstract<T extends BaseEntity>
	implements BaseServiceInterface<T>
{
	constructor(private readonly repository: BaseRepositoryInterface<T>) {}

	async create(create_dto: T | any): Promise<T> {
		return await this.repository.create(create_dto);
	}

	async findAll(
		filter?: object,
		options?: object,
	): Promise<FindAllResponse<T>> {
		return await this.repository.findAll(filter, options);
	}
	async findByID(id: string) {
		return await this.repository.findByID(id);
	}

	async findOne(filter: Partial<T>) {
		return await this.repository.findOne(filter);
	}

	async update(id: string, update_dto: Partial<T>) {
		return await this.repository.update(id, update_dto);
	}

	async softDelete(id: string) {
		return await this.repository.softDelete(id);
	}
}
