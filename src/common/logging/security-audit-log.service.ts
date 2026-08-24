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

  passwordResetRequested(
    email: string,
    outcome: 'sent' | 'unknown_email' | 'cooldown' | 'send_failed',
  ): void {
    logJson(this.logger, {
      event: 'password_reset_requested',
      email,
      outcome,
    });
  }

  passwordResetFailed(
    reason: 'invalid_or_expired_token' | 'inactive_user',
  ): void {
    logJson(
      this.logger,
      {
        event: 'password_reset_failed',
        reason,
      },
      'warn',
    );
  }

  passwordResetCompleted(userId: string): void {
    logJson(this.logger, {
      event: 'password_reset_completed',
      userId,
    });
  }

  accountRecoveryRequested(
    email: string,
    outcome:
      | 'sent'
      | 'unknown_email'
      | 'active_account'
      | 'cooldown'
      | 'send_failed',
  ): void {
    logJson(this.logger, {
      event: 'account_recovery_requested',
      email,
      outcome,
    });
  }
}
