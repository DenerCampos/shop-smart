import { HttpException, HttpStatus } from '@nestjs/common';

export class AudioRecognitionException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        error: 'Audio Recognition Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
