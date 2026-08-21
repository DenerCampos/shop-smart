import { buildEmailLayout, EmailContent } from './email-layout.template';

export interface AccountRecoveryTemplateInput {
  name: string;
  recoverUrl: string;
  ttlMinutes: number;
}

export function buildAccountRecoveryEmail(
  input: AccountRecoveryTemplateInput,
): EmailContent {
  const { html, text } = buildEmailLayout({
    heading: 'Recuperar sua conta',
    paragraphs: [
      `Olá, ${input.name}.`,
      'Recebemos um pedido para reativar a sua conta. Clique no botão abaixo para definir uma nova senha e voltar a acessar o Super Family Quest.',
      `O link é de uso único e expira em ${input.ttlMinutes} minutos.`,
    ],
    cta: { label: 'Recuperar conta', url: input.recoverUrl },
    footerNote:
      'Se não foi você que pediu, ignore este e-mail: a conta permanece desativada.',
  });

  return {
    subject: 'Recuperação de conta - Super Family Quest',
    html,
    text,
  };
}
