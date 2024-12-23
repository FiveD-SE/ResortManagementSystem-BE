import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { EmailDataInterface } from './interfaces/emailData.interface';

@Injectable()
export class EmailService {
	private transporter: nodemailer.Transporter;

	constructor(private readonly configService: ConfigService) {
		this.transporter = nodemailer.createTransport({
			host: this.configService.get<string>('EMAIL_HOST'),
			port: this.configService.get<number>('EMAIL_PORT'),
			auth: {
				user: this.configService.get<string>('EMAIL_USER'),
				pass: this.configService.get<string>('EMAIL_PASS'),
			},
		});
	}

	private convertToHTML(template: string, context: object): string {
		const filePath = path.join(__dirname, `../../templates/${template}.html`);
		let html = fs.readFileSync(filePath, 'utf8');

		for (const [key, value] of Object.entries(context)) {
			const placeholder = `{{${key}}}`;
			html = html.replace(new RegExp(placeholder, 'g'), value as string);
		}

		return html;
	}

	async sendEmail(data: EmailDataInterface): Promise<void> {
		await this.transporter.sendMail({
			from: data.from ?? 'noreply@example.com',
			...data,
		});
	}

	async sendUserVerifyEmail(
		email: string,
		firstName: string,
		token: string,
	): Promise<void> {
		const verificationEmailUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;
		await this.sendEmail({
			to: email,
			subject: 'Verify your account',
			html: this.convertToHTML('mail-verify-email', {
				name: firstName,
				verification_url: verificationEmailUrl,
			}),
		});
	}

	async sendUserResetPasswordEmail(
		email: string,
		name: string,
		token: string,
	): Promise<void> {
		const resetPasswordUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
		await this.sendEmail({
			to: email,
			subject: 'Reset your password',
			html: this.convertToHTML('mail-reset-password', {
				name,
				user_email: email,
				reset_password_url: resetPasswordUrl,
			}),
		});
	}
}
