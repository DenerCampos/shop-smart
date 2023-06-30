import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

export class AlreadyExistsException extends HttpException {
  constructor(options: HttpExceptionOptions = {}) {
    super('The item already exists', HttpStatus.OK, options);
  }
}
