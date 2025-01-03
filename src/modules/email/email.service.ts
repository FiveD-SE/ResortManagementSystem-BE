import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import { EmailDataInterface } from './interfaces/emailData.interface';
import * as pdf from 'html-pdf';

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
		items: { name: string; quantity: number; price: number }[],
		paymentUrl: string,
		orderCode: string,
		totalAmount: number,
	): Promise<void> {
		const itemsHtml = items
			.map(
				(item) => `
            <tr>
                <td style="font-family: 'Montserrat', sans-serif; mso-line-height-rule: exactly; width: 80%; padding-top: 10px; padding-bottom: 10px; font-size: 16px;">
                    ${item.name}
                </td>
                <td align="right" style="font-family: 'Montserrat', sans-serif; mso-line-height-rule: exactly; width: 20%; text-align: right; font-size: 16px;">
                    $${item.price * item.quantity}
                </td>
            </tr>
        `,
			)
			.join('');

		const html = this.convertToHTML('mail-invoice', {
			name,
			items: itemsHtml,
			totalAmount: totalAmount.toFixed(2).toString(),
			paymentUrl,
			dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString(),
		});

		const pdfPath = await this.generateInvoicePDF({
			invoiceNumber: orderCode,
			invoiceDate: new Date().toDateString(),
			customer: { name, email },
			items,
			totalAmount,
		});

		await this.sendEmail({
			to: email,
			subject: 'Your Invoice',
			html,
			attachments: [
				{
					filename: 'invoice.pdf',
					path: pdfPath,
					contentType: 'application/pdf',
				},
			],
		});

		fs.unlinkSync(pdfPath);
	}

	private async generateInvoicePDF(invoiceData: any): Promise<string> {
		const templatePath = path.join(__dirname, `../../templates/invoice.html`);
		const templateHtml = fs.readFileSync(templatePath, 'utf8');

		const compiledHtml = templateHtml
			.replace('{{ invoiceNumber }}', invoiceData.invoiceNumber)
			.replace('{{ invoiceDate }}', invoiceData.invoiceDate)
			.replace('{{ customerName }}', invoiceData.customer.name)
			.replace('{{ customerEmail }}', invoiceData.customer.email)
			.replace('{{ totalAmount }}', invoiceData.totalAmount.toString())
			.replace(
				'{{ items }}',
				(invoiceData.items || [])
					.map(
						(item, index) => `
            <tr>
              <td class="border-b py-3 pl-3">${index + 1}.</td>
              <td class="border-b py-3 pl-2">${item.name}</td>
              <td class="border-b py-3 pl-2 text-right">$${item.price}</td>
              <td class="border-b py-3 pl-2">${item.quantity}</td>
              <td class="border-b py-3 pl-2 text-right">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `,
					)
					.join('') || '',
			);

		const options: pdf.CreateOptions = {
			format: 'A4' as const,
			border: {
				top: '20px',
				right: '20px',
				bottom: '20px',
				left: '20px',
			},
			footer: {
				height: '20mm',
				contents: {
					default:
						'<div style="text-align: center; font-size: 12px;">Page {{page}} of {{pages}}</div>',
				},
			},
			height: '297mm',
			width: '210mm',
			zoomFactor: '1',
		};

		const pdfPath = path.join(__dirname, 'invoice.pdf');

		return new Promise((resolve, reject) => {
			pdf.create(compiledHtml, options).toFile(pdfPath, (err, res) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(pdfPath);
			});
		});
	}
}
