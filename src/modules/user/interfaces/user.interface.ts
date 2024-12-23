/* eslint-disable @typescript-eslint/no-empty-object-type */
import { BaseRepositoryInterface } from '@/repositories/base/base.interface.repo';
import { User } from '../entities/user.entity';

export interface UserRepositoryInterface extends BaseRepositoryInterface<User> {
	findAllWithPagination(filter, options): Promise<any>;
}
