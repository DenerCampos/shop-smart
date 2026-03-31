import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { ResponseService } from 'src/common/response/response';
import { QuotaResponseDto } from './dto/quota-response.dto';
import { TextRecognitionService } from './textRecognition.service';

@Controller('/text-recognition')
export class TextRecognitionController {
  constructor(
    private readonly textRecognitionService: TextRecognitionService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('quota')
  async getQuota(): Promise<QuotaResponseDto> {
    const quotaInfo = await this.textRecognitionService.getProviderQuota();
    return this.responseService.mapToDto(QuotaResponseDto, quotaInfo);
  }
}
