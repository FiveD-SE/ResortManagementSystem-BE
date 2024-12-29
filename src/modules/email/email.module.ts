import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
	imports: [],
	providers: [EmailService],
	controllers: [EmailController],
	exports: [EmailService],
})
export class EmailModule {}
