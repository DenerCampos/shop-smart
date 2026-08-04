import { Controller, Get, UseGuards } from '@nestjs/common';
import { seconds, Throttle } from '@nestjs/throttler';
import { AuthGuard } from 'src/auth/auth.guard';
import { ImageRecognitionService } from './imageRecognition.service';
import { ResponseService } from 'src/common/response/response';
import { QuotaResponseDto } from './dto/quota-response.dto';

@Controller('/image-recognition')
@Throttle({ default: { limit: 20, ttl: seconds(60) } })
export class ImageRecognitionController {
  constructor(
    private readonly imageRecognitionService: ImageRecognitionService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('quota')
  async getQuota(): Promise<QuotaResponseDto> {
    const quotaInfo = await this.imageRecognitionService.getProviderQuota();
    return this.responseService.mapToDto(QuotaResponseDto, quotaInfo);
  }
}
