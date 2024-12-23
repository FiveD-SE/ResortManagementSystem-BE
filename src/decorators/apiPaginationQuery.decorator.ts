import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function ApiPaginationQuery() {
	return applyDecorators(
		ApiQuery({ name: 'page', required: false, type: Number }),
		ApiQuery({ name: 'limit', required: false, type: Number }),
		ApiQuery({ name: 'sort', required: false, type: String }),
	);
}
