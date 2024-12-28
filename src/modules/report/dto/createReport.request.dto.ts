import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReportRequestDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(50)
	reportType?: string;

	@IsNotEmpty()
	@IsString()
	@MaxLength(500)
	description?: string;
}
