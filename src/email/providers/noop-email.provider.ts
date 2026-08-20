import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from 'src/common/app-config/app.config';
import { logJson } from 'src/common/logging/log-event.util';
import {
  IEmailProvider,
  SendEmailInput,
  SendEmailResult,
} from '../interfaces/email-provider.interface';

/**
 * Não envia nada. Em desenvolvimento o corpo vai só para `Logger.debug`
 * (fora do `logJson`/Loki), para pegar o link de reset sem gastar cota.
 */
@Injectable()
export class NoopEmailProvider implements IEmailProvider {
  readonly name = 'noop' as const;

  private readonly logger = new Logger(NoopEmailProvider.name);

  constructor(private readonly appConfig: AppConfig) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    logJson(this.logger, {
      event: 'email_noop_send',
      to: input.to,
      subject: input.subject,
    });

    if (this.appConfig.isDevelopment()) {
      this.logger.debug(input.text);
    }

    return { success: true, messageId: 'noop' };
  }
}
