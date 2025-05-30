import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

export class InsufficientResourceException extends HttpException {
  constructor(options: HttpExceptionOptions = {}) {
    super('Insufficient resource.', HttpStatus.NOT_FOUND, options);
  }
}
