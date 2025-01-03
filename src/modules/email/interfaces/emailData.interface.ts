export interface EmailDataInterface {
	to: string;
	from?: string;
	subject: string;
	text?: string;
	html: string;
	attachments?: { filename: string; path: string; contentType: string }[];
}
