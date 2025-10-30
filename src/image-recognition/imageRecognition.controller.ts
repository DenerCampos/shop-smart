import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { ImageRecognitionService } from './imageRecognition.service';
import { ResponseService } from 'src/common/response/response';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { AnalyzeImageRecognitionResponseDto } from './dto/analyze-image-recognition-response.dto';
import { memoryStorage } from 'multer';

@Controller('/image-recognition')
export class ImageRecognitionController {
  constructor(
    private readonly imagerecognitionService: ImageRecognitionService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('analyze')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1, // Aceita apenas 1 arquivo
      },
      fileFilter: (req, file, callback) => {
        // Valida o tipo do arquivo
        if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Apenas imagens são permitidas'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async analyzeImage(
    @UploadedFile() image: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<AnalyzeImageRecognitionResponseDto> {
    if (!image) {
      throw new BadRequestException('Imagem não fornecida');
    }

    const result = await this.imagerecognitionService.analyzeImage(
      image.buffer,
      user,
    );

    return this.responseService.mapToDto(
      AnalyzeImageRecognitionResponseDto,
      result,
    );
  }
}