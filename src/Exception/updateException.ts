import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

export class UpdateException extends HttpException {
  constructor(options: HttpExceptionOptions = {}) {
    super('Update error, not found item.', HttpStatus.NOT_FOUND, options);
  }
}
