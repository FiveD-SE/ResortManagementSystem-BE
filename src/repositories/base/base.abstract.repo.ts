import { BaseEntity } from '@modules/shared/base/base.entity';
import { FilterQuery, Model, QueryOptions } from 'mongoose';
import { FindAllResponse } from 'src/types/common.type';

import { BaseRepositoryInterface } from './base.interface.repo';

export abstract class BaseRepositoryAbstract<T extends BaseEntity>
	implements BaseRepositoryInterface<T>
{
	protected constructor(private readonly model: Model<T>) {
		this.model = model;
	}

	async create(dto: T | any): Promise<T> {
		const data = await this.model.create(dto);
		return data.save();
	}

	async findByID(id: string): Promise<T> {
		return await this.model.findById(id);
	}

	async findOne(condition = {}): Promise<T> {
		return await this.model.findOne(condition).exec();
	}

	async findAll(
		condition: FilterQuery<T>,
		options?: QueryOptions<T>,
	): Promise<FindAllResponse<T>> {
		const [count, items] = await Promise.all([
			this.model.countDocuments(condition),
			this.model.find(
				{ ...condition, deleted_at: null },
				options?.projection,
				options,
			),
		]);
		return {
			count,
			items,
		};
	}

	async update(id: string, dto: Partial<T>): Promise<T> {
		return await this.model.findOneAndUpdate({ _id: id }, dto, { new: true });
	}

	async softDelete(id: string): Promise<boolean> {
		const deleteItem = await this.model.findById(id);
		if (!deleteItem) {
			return false;
		}

		return !!(await this.model
			.findByIdAndUpdate<T>(id, { deleted_at: new Date() })
			.exec());
	}

	async permanentlyDelete(id: string): Promise<boolean> {
		const deleteItem = await this.model.findById(id);
		if (!deleteItem) {
			return false;
		}
		return !!(await this.model.findByIdAndDelete(id));
	}
}
