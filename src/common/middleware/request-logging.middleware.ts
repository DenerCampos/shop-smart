import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logJson } from '../logging/log-event.util';
import { getClientIp } from '../utils/client-ip.util';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const path = req.originalUrl?.split('?')[0] || req.url?.split('?')[0] || '';

    res.on('finish', () => {
      const duration_ms = Date.now() - start;
      const client_ip = getClientIp(req);
      logJson(this.logger, {
        event: 'http_request',
        method: req.method,
        path,
        status_code: res.statusCode,
        duration_ms,
        ...(client_ip ? { client_ip } : {}),
      });
    });

    next();
  }
}
