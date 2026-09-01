import { HttpException, HttpStatus } from '@nestjs/common';

export const AI_PROVIDER_ERROR_CODE = 'AI_PROVIDER_ERROR';

export const AI_PROVIDER_ERROR_MESSAGE =
  'Falha no modelo de IA. Tente mais tarde.';

export class AiProviderException extends HttpException {
  constructor(message = AI_PROVIDER_ERROR_MESSAGE) {
    super(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        message,
        error: AI_PROVIDER_ERROR_CODE,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}
