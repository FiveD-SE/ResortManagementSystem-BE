import {
	IsNotEmpty,
	IsNumber,
	IsString,
	IsDate,
	IsArray,
} from 'class-validator';

export class CreateInvoiceDto {
	@IsNotEmpty()
	@IsString()
	userId: string;

	@IsNotEmpty()
	@IsNumber()
	amount: number;

	@IsNotEmpty()
	@IsString()
	description: string;

	@IsNotEmpty()
	@IsString()
	returnUrl: string;

	@IsNotEmpty()
	@IsString()
	cancelUrl: string;

	@IsNotEmpty()
	@IsDate()
	issueDate: Date;

	@IsNotEmpty()
	@IsDate()
	dueDate: Date;

	@IsNotEmpty()
	@IsArray()
	items: any[];
}
