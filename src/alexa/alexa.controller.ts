import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AlexaResponse, AlexaService } from './alexa.service';
import { AlexaIntentRequestDto } from './dto/alexa-intent-request.dto';

@Controller('alexa')
export class AlexaController {
  constructor(private readonly alexaService: AlexaService) {}

  @Post('intent')
  @HttpCode(200)
  async handleIntent(
    @Body() dto: AlexaIntentRequestDto,
  ): Promise<AlexaResponse> {
    return this.alexaService.handleIntent(dto);
  }
}
