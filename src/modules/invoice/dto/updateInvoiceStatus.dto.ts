import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateInvoiceStatusDto {
	@IsNotEmpty()
	@IsString()
	status: string;
}
