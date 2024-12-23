import { PickType } from '@nestjs/swagger';
import { UpdateUserRequestDTO } from './updateUser.request.dto';

export class ChangeProfileRequestDTO extends PickType(UpdateUserRequestDTO, [
	'firstName',
	'lastName',
	'dob',
	'gender',
]) {}
