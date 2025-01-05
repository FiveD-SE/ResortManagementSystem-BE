import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { UserService } from '../modules/user/user.service';
import { ServiceTypeService } from '../modules/serviceType/serviceType.service';
import { UserRole } from '../modules/user/entities/user.entity';
import { CreateUserRequestDTO } from '../modules/user/dto/request/createUser.request.dto';
import { CreateServiceTypeRequestDto } from '../modules/serviceType/dto/createServiceType.request.dto';

async function bootstrap() {
	const app = await NestFactory.createApplicationContext(AppModule);
	const userService = app.get(UserService);
	const serviceTypeService = app.get(ServiceTypeService);

	const serviceTypeDto: CreateServiceTypeRequestDto = {
		typeName: 'Example Service Type',
		description: 'This is an example service type',
	};
	const serviceType = await serviceTypeService.create(serviceTypeDto);

	const adminDto: CreateUserRequestDTO = {
		email: 'admin@example.com',
		password: 'Example@123',
		firstName: 'Admin',
		lastName: 'User',
		role: UserRole.Admin,
	};
	await userService.create(adminDto);

	const receptionistDto: CreateUserRequestDTO = {
		email: 'receptionist@example.com',
		password: 'Example@123',
		firstName: 'Receptionist',
		lastName: 'User',
		role: UserRole.Receptionist,
	};
	await userService.create(receptionistDto);

	const userDto: CreateUserRequestDTO = {
		email: 'user@example.com',
		password: 'Example@123',
		firstName: 'Regular',
		lastName: 'User',
		role: UserRole.User,
	};
	await userService.create(userDto);

	const serviceStaffDto: CreateUserRequestDTO = {
		email: 'staff@example.com',
		password: 'Example@123',
		firstName: 'Service',
		lastName: 'Staff',
		role: UserRole.Service_Staff,
		serviceTypeId: serviceType._id.toString(),
	};
	await userService.create(serviceStaffDto);

	await app.close();
}

bootstrap();
