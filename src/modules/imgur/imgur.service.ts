import { ConfigService } from '@nestjs/config';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ImgurClient } from 'imgur';
import { UploadImageToImgurResponseDto } from './dto/response/uploadImageToImgur.response.dto';

@Injectable()
export class ImgurService {
	private readonly logger = new Logger(ImgurService.name);

	constructor(private readonly configService: ConfigService) {}

	uploadImage = async (
		imageFile: Express.Multer.File,
	): Promise<UploadImageToImgurResponseDto> => {
		const allowedTypes = ['image/jpeg', 'image/png'];
		if (!allowedTypes.includes(imageFile.mimetype)) {
			throw new BadRequestException(
				"Invalid file type. Only 'jpeg' and 'png' images are allowed",
			);
		}

		const imgurClient = new ImgurClient({
			clientId: this.configService.get<string>('IMGUR_CLIENT_ID'),
		});
		const res = await imgurClient.upload({
			image: imageFile.buffer.toString('base64'),
		});
		this.logger.log('Image Uploaded: ', res);

		if (!res.success) {
			throw new BadRequestException('Failed to upload image to imgur');
		}

		return {
			imageUrl: res.data.link,
		};
	};
}
