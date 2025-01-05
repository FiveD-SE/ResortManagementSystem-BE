import { Controller, UploadedFile } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ApiBodyWithSingleFile } from '@/decorators/apiBodyWithSingleFile.decorator';
import { ApiPost } from '@/decorators/apiPost.decorator';
import { ImgurService } from './imgur.service';
import { UploadImageToImgurResponseDto } from './dto/response/uploadImageToImgur.response.dto';

@Controller('image')
@ApiTags('Image')
export class ImgurController {
	constructor(private readonly imgurService: ImgurService) {}
	@ApiPost({ path: 'upload' })
	@ApiBodyWithSingleFile('imageFile', null, ['imageFile'])
	@ApiOkResponse({
		type: UploadImageToImgurResponseDto,
	})
	async uploadImageToImgur(@UploadedFile() file: Express.Multer.File) {
		return this.imgurService.uploadImage(file);
	}
}
