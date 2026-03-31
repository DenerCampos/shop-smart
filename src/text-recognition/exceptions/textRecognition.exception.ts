import { HttpException, HttpStatus } from '@nestjs/common';

export class TextRecognitionException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Text Recognition Error',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
