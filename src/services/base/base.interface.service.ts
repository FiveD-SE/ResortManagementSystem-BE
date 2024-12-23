import { FindAllResponse } from 'src/types/common.type';

export interface Write<T> {
	create(item: T | any): Promise<T>;
	update(id: string, item: Partial<T>): Promise<T>;
	softDelete(id: string): Promise<boolean>;
}

export interface Read<T> {
	findAll(filter?: object, options?: object): Promise<FindAllResponse<T>>;
	findByID(id: string): Promise<T>;
	findOne(filter: Partial<T>): Promise<T>;
}

export interface BaseServiceInterface<T> extends Write<T>, Read<T> {}
