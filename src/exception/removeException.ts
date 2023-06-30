import {
  HttpException,
  HttpExceptionOptions,
  HttpStatus,
} from '@nestjs/common';

export class RemoveException extends HttpException {
  constructor(options: HttpExceptionOptions = {}) {
    super('Remove error, not found item.', HttpStatus.NOT_FOUND, options);
  }
}
