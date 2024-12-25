import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

export function ApiBodyWithFiles(
	name = 'files',
	maxCount = 10,
	bodyProperties?: object,
	requiredProperties?: string[],
) {
	const properties = {
		...bodyProperties,
		[name]: {
			type: 'array',
			items: {
				type: 'string',
				format: 'binary',
			},
		},
	};

	const required = requiredProperties ? requiredProperties : [name];

	return applyDecorators(
		ApiConsumes('multipart/form-data'),
		ApiBody({
			schema: {
				type: 'object',
				properties,
				required,
			},
		}),
		UseInterceptors(FilesInterceptor(name, maxCount)),
	);
}
