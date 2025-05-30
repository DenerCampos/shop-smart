import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

export class NotExistException extends HttpException {
  constructor(options: HttpExceptionOptions = {}) {
    super('Does not exist.', HttpStatus.NOT_FOUND, options);
  }
}
