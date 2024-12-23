import { FindAllResponse } from '@/types/common.type';

export interface BaseRepositoryInterface<T> {
	create(dto: T | any): Promise<T>;

	findByID(id: string, projection?: string): Promise<T>;

	findOne(condition?: object, projection?: string): Promise<T>;

	findAll(condition: object, options?: object): Promise<FindAllResponse<T>>;

	update(id: string, dto: Partial<T>): Promise<T>;

	softDelete(id: string): Promise<boolean>;

	permanentlyDelete(id: string): Promise<boolean>;
}
