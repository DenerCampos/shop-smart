import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winston: Logger,
  ) {}

  log(message: string, context?: string) {
    this.winston.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.winston.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.winston.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.winston.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.winston.verbose(message, { context });
  }
}
