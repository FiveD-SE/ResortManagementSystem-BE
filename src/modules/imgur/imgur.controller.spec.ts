import { Test, TestingModule } from '@nestjs/testing';
import { ImgurController } from './imgur.controller';
import { ImgurService } from './imgur.service';

describe('ImgurController', () => {
  let controller: ImgurController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImgurController],
      providers: [ImgurService],
    }).compile();

    controller = module.get<ImgurController>(ImgurController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
