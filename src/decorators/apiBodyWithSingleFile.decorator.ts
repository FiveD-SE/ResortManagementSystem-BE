import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import {
	ReferenceObject,
	SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export function ApiBodyWithSingleFile(
	name = 'file',
	body_properties?: object,
	required_properties?: string[],
	local_options?: MulterOptions,
) {
	let properties: Record<string, SchemaObject | ReferenceObject>;
	const api_body = {
		schema: {
			type: 'object',
			properties,
			required: required_properties,
		},
	};
	if (!body_properties) {
		api_body.schema = {
			...api_body.schema,
			properties: {
				[name]: {
					type: 'string',
					format: 'binary',
				},
			},
		};
	} else {
		api_body.schema = {
			...api_body.schema,
			properties: {
				...body_properties,
				[name]: {
					type: 'string',
					format: 'binary',
				},
			},
		};
	}
	return applyDecorators(
		ApiConsumes('multipart/form-data'),
		ApiBody(api_body),
		UseInterceptors(FileInterceptor(name, local_options)),
	);
}
