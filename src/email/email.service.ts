import { Inject, Injectable, Logger } from '@nestjs/common';
import { AppConfig } from 'src/common/app-config/app.config';
import { logJson } from 'src/common/logging/log-event.util';
import { EMAIL_PROVIDER } from './email.constants';
import {
  IEmailProvider,
  SendEmailResult,
} from './interfaces/email-provider.interface';
import { EmailContent, toAbsoluteUrl } from './templates/email-layout.template';
import { buildNotificationEmail } from './templates/notification.template';
import { buildPasswordResetEmail } from './templates/password-reset.template';
import { buildWelcomeEmail } from './templates/welcome.template';

export type EmailKind = 'password_reset' | 'welcome' | 'notification';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly provider: IEmailProvider,
    private readonly appConfig: AppConfig,
  ) {}

  async sendPasswordReset(input: {
    to: string;
    name: string;
    token: string;
  }): Promise<SendEmailResult> {
    const ttlMinutes = this.appConfig.getPasswordResetTokenTtlMinutes();
    const resetUrl = `${this.frontendUrl()}/reset-password?token=${encodeURIComponent(input.token)}`;

    return await this.dispatch(
      'password_reset',
      input.to,
      input.name,
      buildPasswordResetEmail({ name: input.name, resetUrl, ttlMinutes }),
    );
  }

  async sendWelcome(input: {
    to: string;
    name: string;
  }): Promise<SendEmailResult> {
    return await this.dispatch(
      'welcome',
      input.to,
      input.name,
      buildWelcomeEmail({ name: input.name, appUrl: this.frontendUrl() }),
    );
  }

  async sendNotification(input: {
    to: string;
    toName?: string;
    title: string;
    body: string;
    actorName?: string;
    actionUrl?: string | null;
    ctaLabel?: string;
  }): Promise<SendEmailResult> {
    const actionUrl = input.actionUrl
      ? toAbsoluteUrl(this.frontendUrl(), input.actionUrl)
      : null;

    return await this.dispatch(
      'notification',
      input.to,
      input.toName,
      buildNotificationEmail({
        title: input.title,
        body: input.body,
        actorName: input.actorName,
        actionUrl,
        ctaLabel: input.ctaLabel,
      }),
    );
  }

  /**
   * Nunca propaga exceção: falha de e-mail não pode derrubar cadastro, convite
   * nem pedido de redefinição de senha.
   */
  private async dispatch(
    kind: EmailKind,
    to: string,
    toName: string | undefined,
    content: EmailContent,
  ): Promise<SendEmailResult> {
    try {
      const result = await this.provider.sendEmail({
        to,
        toName,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });

      logJson(
        this.logger,
        {
          event: 'email_sent',
          kind,
          provider: this.provider.name,
          to,
          ok: result.success,
          messageId: result.messageId ?? null,
          error_message: result.error ?? null,
        },
        result.success ? 'log' : 'error',
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logJson(
        this.logger,
        {
          event: 'email_exception',
          kind,
          provider: this.provider.name,
          to,
          error_message: errorMessage,
        },
        'error',
      );

      return { success: false, error: errorMessage };
    }
  }

  private frontendUrl(): string {
    return this.appConfig.getFrontendUrl().replace(/\/+$/, '');
  }
}
