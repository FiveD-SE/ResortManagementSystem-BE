import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { SortOrder } from '@/types/common.type';

export function ApiPaginationQuery() {
	return applyDecorators(
		ApiQuery({
			name: 'page',
			required: false,
			type: Number,
			description: 'Page number',
		}),
		ApiQuery({
			name: 'limit',
			required: false,
			type: Number,
			description: 'Items per page',
		}),
		ApiQuery({
			name: 'sortBy',
			required: false,
			type: String,
			description: 'Field to sort by',
		}),
		ApiQuery({
			name: 'sortOrder',
			required: false,
			enum: SortOrder,
			description: 'Sort order (asc/desc)',
		}),
	);
}
