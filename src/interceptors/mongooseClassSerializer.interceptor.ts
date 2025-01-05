import {
	ClassSerializerInterceptor,
	PlainLiteralObject,
	Type,
} from '@nestjs/common';
import { ClassTransformOptions, plainToClass } from 'class-transformer';
import { Document } from 'mongoose';

import { PaginateData } from '@/types/common.type';

export default function MongooseClassSerializerInterceptor(
	classToIntercept: Type,
): typeof ClassSerializerInterceptor {
	return class Interceptor extends ClassSerializerInterceptor {
		private changePlainObjectToClass(document: PlainLiteralObject) {
			if (!(document instanceof Document)) {
				return document;
			}
			return plainToClass(classToIntercept, document.toJSON(), {
				excludePrefixes: ['_'],
			});
		}

		private prepareResponse(
			response: PlainLiteralObject | PlainLiteralObject[] | PaginateData<any>,
		) {
			if (!Array.isArray(response) && response?.docs) {
				const { docs, ...rest } = response;
				const result = this.prepareResponse(docs);
				return {
					...rest,
					docs: result,
				};
			}

			if (Array.isArray(response)) {
				return response.map(this.changePlainObjectToClass);
			}

			return this.changePlainObjectToClass(response);
		}

		serialize(
			response: PlainLiteralObject | PlainLiteralObject[],
			options: ClassTransformOptions,
		) {
			return super.serialize(this.prepareResponse(response), options);
		}
	};
}
