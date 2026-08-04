import { HttpException, HttpStatus } from '@nestjs/common';

export class ChatAiProviderException extends HttpException {
  constructor(
    message = 'Falha ao consultar o assistente de IA. Tente novamente.',
  ) {
    super(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        message,
        error: 'CHAT_AI_PROVIDER_ERROR',
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class ChatToolForbiddenException extends HttpException {
  constructor(message = 'Você não tem permissão para acessar esses dados.') {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message,
        error: 'CHAT_TOOL_FORBIDDEN',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
