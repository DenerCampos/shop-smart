import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { AudioRecognitionService } from './audioRecognition.service';
import { ResponseService } from 'src/common/response/response';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { AnalyzeAudioRecognitionResponseDto } from './dto/analyze-audio-recognition-response.dto';
import { QuotaResponseDto } from './dto/quota-response.dto';
import { memoryStorage } from 'multer';

@Controller('/audio-recognition')
export class AudioRecognitionController {
  constructor(
    private readonly audioRecognitionService: AudioRecognitionService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('analyze')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB - suficiente para ~2min de áudio
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        // Valida o tipo do arquivo (aceita MIME types com parâmetros, ex: audio/webm;codecs=opus)
        // Nota: video/webm também é aceito pois alguns navegadores gravam áudio como video/webm
        const audioRegex =
          /^(audio|video)\/(webm|mp3|wav|mpeg|ogg|mp4|x-m4a|aac|flac|x-wav)/i;
        const mimeTypeBase = file.mimetype.split(';')[0].trim(); // Remove parâmetros como ;codecs=opus

        if (!audioRegex.test(mimeTypeBase)) {
          return callback(
            new BadRequestException(
              `Tipo de arquivo não suportado: ${file.mimetype}. Envie um arquivo de áudio válido.`,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async analyzeAudio(
    @UploadedFile() audio: Express.Multer.File,
    @CurrentUser() user: User,
  ): Promise<AnalyzeAudioRecognitionResponseDto> {
    if (!audio) {
      throw new BadRequestException('Áudio não fornecido');
    }

    if (!audio.buffer || audio.buffer.length === 0) {
      throw new BadRequestException('Buffer de áudio vazio');
    }

    if (audio.size < 1024) {
      throw new BadRequestException('Áudio muito curto (menos de 1KB)');
    }

    if (!Buffer.isBuffer(audio.buffer)) {
      throw new BadRequestException('Buffer inválido');
    }

    const result = await this.audioRecognitionService.analyzeAudio(
      audio.buffer,
      audio.mimetype,
      user,
    );

    return this.responseService.mapToDto(
      AnalyzeAudioRecognitionResponseDto,
      result,
    );
  }

  @UseGuards(AuthGuard)
  @Get('quota')
  async getQuota(): Promise<QuotaResponseDto> {
    const quotaInfo = await this.audioRecognitionService.getProviderQuota();
    return this.responseService.mapToDto(QuotaResponseDto, quotaInfo);
  }
}
