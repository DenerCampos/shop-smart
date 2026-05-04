import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ApiQuotaException } from '../ai-quota/exceptions/apiQuota.exception';
import { logJson } from '../logging/log-event.util';
import { getClientIp } from '../utils/client-ip.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path =
      request.originalUrl?.split('?')[0] || request.url?.split('?')[0] || '';
    const method = request.method;
    const client_ip = getClientIp(request);
    const ipFields = client_ip ? { client_ip } : {};

    if (exception instanceof ApiQuotaException) {
      const status = exception.getStatus();
      logJson(
        this.logger,
        {
          event: 'quota_exceeded',
          path,
          method,
          status_code: status,
          provider: exception.provider,
          daily_limit: exception.dailyLimit,
          current_usage: exception.currentUsage,
          ...ipFields,
        },
        'warn',
      );
      response.status(status).json(exception.getResponse());
      return;
    }

    if (exception instanceof ThrottlerException) {
      const status = exception.getStatus();
      logJson(
        this.logger,
        {
          event: 'throttle_exceeded',
          path,
          method,
          status_code: status,
          ...ipFields,
        },
        'warn',
      );
      response.status(status).json(exception.getResponse());
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : (body as { message?: string | string[] })?.message;
      const safeMessage = Array.isArray(message)
        ? message.join('; ')
        : message || exception.message;

      logJson(
        this.logger,
        {
          event: 'http_exception',
          path,
          method,
          status_code: status,
          message:
            typeof safeMessage === 'string'
              ? safeMessage.slice(0, 500)
              : undefined,
          ...ipFields,
        },
        status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : 'warn',
      );
      response.status(status).json(body);
      return;
    }

    const isDev = process.env.NODE_ENV === 'development';
    const errMessage =
      exception instanceof Error ? exception.message : String(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;

    logJson(
      this.logger,
      {
        event: 'unhandled_error',
        path,
        method,
        status_code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: errMessage.slice(0, 500),
        ...(isDev && stack ? { stack: stack.slice(0, 2000) } : {}),
        ...ipFields,
      },
      'error',
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
