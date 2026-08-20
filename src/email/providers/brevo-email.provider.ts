import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { AppConfig } from 'src/common/app-config/app.config';
import {
  BREVO_SEND_EMAIL_URL,
  EMAIL_REQUEST_TIMEOUT_MS,
} from '../email.constants';
import {
  IEmailProvider,
  SendEmailInput,
  SendEmailResult,
} from '../interfaces/email-provider.interface';

interface BrevoSendResponse {
  messageId?: string;
}

@Injectable()
export class BrevoEmailProvider implements IEmailProvider {
  readonly name = 'brevo' as const;

  constructor(private readonly appConfig: AppConfig) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const { apiKey, from, fromName } = this.appConfig.getEmail();

    if (!apiKey || !from) {
      return { success: false, error: 'brevo_not_configured' };
    }

    try {
      const response = await axios.post<BrevoSendResponse>(
        BREVO_SEND_EMAIL_URL,
        {
          sender: { name: fromName, email: from },
          to: [{ email: input.to, name: input.toName ?? input.to }],
          subject: input.subject,
          htmlContent: input.html,
          textContent: input.text,
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: EMAIL_REQUEST_TIMEOUT_MS,
        },
      );

      return { success: true, messageId: response.data?.messageId };
    } catch (error) {
      return { success: false, error: this.describeError(error) };
    }
  }

  /**
   * Descreve a falha sem incluir o corpo enviado nem a chave de API, que iriam
   * para o Loki junto com o log.
   */
  private describeError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const body = error.response?.data as
        | { message?: string; code?: string }
        | undefined;

      if (status) {
        return `brevo_http_${status}: ${body?.code ?? ''} ${body?.message ?? ''}`.trim();
      }

      return error.code === 'ECONNABORTED' ? 'brevo_timeout' : 'brevo_network';
    }

    return error instanceof Error ? error.message : String(error);
  }
}
