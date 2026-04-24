import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { seconds, Throttle } from '@nestjs/throttler';
import { AlexaResponse, AlexaService } from './alexa.service';
import { AlexaIntentRequestDto } from './dto/alexa-intent-request.dto';

@Controller('alexa')
export class AlexaController {
  constructor(private readonly alexaService: AlexaService) {}

  // Sem AuthGuard: a Alexa autentica via assinatura de request (verificada no AlexaService)
  @Throttle({ default: { limit: 30, ttl: seconds(60) } })
  @Post('intent')
  @HttpCode(200)
  async handleIntent(
    @Body() dto: AlexaIntentRequestDto,
  ): Promise<AlexaResponse> {
    return this.alexaService.handleIntent(dto);
  }
}
