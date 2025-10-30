import { HttpException, HttpStatus } from '@nestjs/common';

export class ImageRecognitionException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Erro na análise da imagem: ${message}`,
        error: 'Image Recognition Error',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
