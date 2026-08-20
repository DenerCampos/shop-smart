import { buildEmailLayout, EmailContent } from './email-layout.template';

export interface PasswordResetTemplateInput {
  name: string;
  resetUrl: string;
  ttlMinutes: number;
}

export function buildPasswordResetEmail(
  input: PasswordResetTemplateInput,
): EmailContent {
  const { html, text } = buildEmailLayout({
    heading: 'Redefinir sua senha',
    paragraphs: [
      `Olá, ${input.name}.`,
      'Recebemos um pedido para redefinir a senha da sua conta. Clique no botão abaixo para escolher uma nova senha.',
      `O link é de uso único e expira em ${input.ttlMinutes} minutos.`,
    ],
    cta: { label: 'Redefinir senha', url: input.resetUrl },
    footerNote:
      'Se não foi você que pediu, ignore este e-mail: sua senha atual continua valendo.',
  });

  return { subject: 'Redefinição de senha - Super Family Quest', html, text };
}
