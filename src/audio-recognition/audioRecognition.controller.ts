import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { AudioRecognitionService } from './audioRecognition.service';
import { ResponseService } from 'src/common/response/response';
import { QuotaResponseDto } from './dto/quota-response.dto';

@Controller('/audio-recognition')
export class AudioRecognitionController {
  constructor(
    private readonly audioRecognitionService: AudioRecognitionService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('quota')
  async getQuota(): Promise<QuotaResponseDto> {
    const quotaInfo = await this.audioRecognitionService.getProviderQuota();
    return this.responseService.mapToDto(QuotaResponseDto, quotaInfo);
  }
}
