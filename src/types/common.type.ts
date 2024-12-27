import { BaseEntity } from '@/modules/shared/base/base.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum SORT_TYPE {
	DESC = 'desc',
	ASC = 'asc',
}

export type FindAllResponse<T> = { count: number; items: T[] };

export type SortParams = { sort_by: string; sort_type: SORT_TYPE };

export type SearchParams = { keyword: string; field: string };

export class PaginateData<T extends BaseEntity> {
	@ApiProperty()
	page: number;
	@ApiProperty()
	limit: number;
	@ApiProperty()
	totalDocs: number;
	@ApiProperty()
	hasNextPage: boolean;
	@ApiProperty()
	hasPrevPage: boolean;
	@ApiProperty()
	nextPage: number | null;
	@ApiProperty()
	prevPage: number | null;
	@ApiProperty()
	totalPages: number;
	@ApiProperty()
	pagingCounter: number;
	@ApiProperty({ type: [Object] })
	docs: T[];
}

export type PaginateParams = {
	page: number;
	limit: number;
	sort?: SORT_TYPE;
};
