import { HttpException, HttpStatus } from '@nestjs/common';

export class ProviderNotFoundException extends HttpException {
  constructor(providerName: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Provider ${providerName} não encontrado`,
        error: 'Provider Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
