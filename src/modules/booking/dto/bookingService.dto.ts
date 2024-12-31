import { IsDate, IsString, IsNumber } from 'class-validator';

export class BookingServiceDTO {
	@IsString()
	id: string;

	@IsString()
	serviceName: string;

	@IsString()
	serviceTypeName: string;

	@IsNumber()
	roomNumber: string;

	@IsDate()
	checkinDate: Date;

	@IsDate()
	checkoutDate: Date;

	@IsNumber()
	quantity: number;

	@IsString()
	status: string;

	@IsNumber()
	price: number;
}
