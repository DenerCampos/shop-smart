import { buildEmailLayout, EmailContent } from './email-layout.template';

export interface NotificationTemplateInput {
  title: string;
  body: string;
  actorName?: string;
  actionUrl?: string | null;
  ctaLabel?: string;
}

/**
 * Layout genérico do canal de e-mail: qualquer notificação vira título, corpo e
 * um botão para o `actionUrl`, sem precisar de um template por tipo.
 */
export function buildNotificationEmail(
  input: NotificationTemplateInput,
): EmailContent {
  const paragraphs = [input.body];

  if (input.actorName) {
    paragraphs.push(`Enviado por ${input.actorName}.`);
  }

  const { html, text } = buildEmailLayout({
    heading: input.title,
    paragraphs,
    cta: input.actionUrl
      ? { label: input.ctaLabel ?? 'Abrir no app', url: input.actionUrl }
      : undefined,
  });

  return { subject: `${input.title} - Super Family Quest`, html, text };
}
