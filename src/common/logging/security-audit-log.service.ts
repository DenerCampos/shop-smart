import { Injectable, Logger } from '@nestjs/common';
import { logJson } from './log-event.util';

@Injectable()
export class SecurityAuditLogService {
  private readonly logger = new Logger(SecurityAuditLogService.name);

  authLoginFailed(email: string): void {
    logJson(
      this.logger,
      {
        event: 'auth_login_failed',
        email,
        reason: 'invalid_credentials',
      },
      'warn',
    );
  }

  authRefreshFailed(
    email: string,
    reason: 'invalid_refresh' | 'user_not_found',
  ): void {
    logJson(
      this.logger,
      {
        event: 'auth_refresh_failed',
        email,
        reason,
      },
      'warn',
    );
  }
}
