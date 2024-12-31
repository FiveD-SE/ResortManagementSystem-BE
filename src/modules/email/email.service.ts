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
			from: this.configService.get<string>('EMAIL_FROM'),
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

	async sendInvoiceEmail(
		email: string,
		name: string,
		items: { name: string; amount: number }[],
		paymentUrl: string,
	): Promise<void> {
		const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
		const itemsHtml = items
			.map(
				(item) => `
                <tr>
                    <td style="font-family: 'Montserrat', sans-serif; mso-line-height-rule: exactly; width: 80%; padding-top: 10px; padding-bottom: 10px; font-size: 16px;">
                        ${item.name}
                    </td>
                    <td align="right" style="font-family: 'Montserrat', sans-serif; mso-line-height-rule: exactly; width: 20%; text-align: right; font-size: 16px;">
                        $${item.amount.toFixed(2)}
                    </td>
                </tr>
            `,
			)
			.join('');

		const html = this.convertToHTML('mail-invoice', {
			name,
			items: itemsHtml,
			totalAmount: `$${totalAmount.toFixed(2)}`,
			paymentUrl,
			dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString(),
		});

		await this.sendEmail({
			to: email,
			subject: 'Your Invoice',
			html,
		});
	}
}
