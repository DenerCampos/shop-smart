export interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailProvider {
  readonly name: 'brevo' | 'noop';
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}
