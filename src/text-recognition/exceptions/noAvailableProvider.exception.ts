import { HttpException, HttpStatus } from '@nestjs/common';

export class NoAvailableProviderException extends HttpException {
  constructor() {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Nenhum provedor disponível no momento',
        error: 'No Available Provider',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
