export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface EmailLayoutInput {
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  footerNote?: string;
}

/**
 * Nomes de grupo, de usuário e títulos de notificação vêm de entrada do usuário
 * e são interpolados no HTML do e-mail — sem escape, viram injeção de markup.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Junta o caminho relativo de uma notificação com a URL do front. */
export function toAbsoluteUrl(frontendUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;

  const base = frontendUrl.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;

  return `${base}${suffix}`;
}

/**
 * Layout único para todos os e-mails. HTML com estilo inline (clientes de
 * e-mail ignoram `<style>` externo) e sempre acompanhado da versão em texto
 * puro, porque e-mail só-HTML é penalizado por filtros de spam.
 */
export function buildEmailLayout(input: EmailLayoutInput): {
  html: string;
  text: string;
} {
  const paragraphsHtml = input.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">${escapeHtml(paragraph)}</p>`,
    )
    .join('');

  const ctaHtml = input.cta
    ? `<p style="margin:24px 0;">
             <a href="${escapeHtml(input.cta.url)}" style="display:inline-block;padding:12px 24px;background-color:#4c1d95;color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">${escapeHtml(input.cta.label)}</a>
           </p>
           <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#71717a;">
             Se o botão não funcionar, copie e cole este endereço no navegador:<br />
             <span style="word-break:break-all;">${escapeHtml(input.cta.url)}</span>
           </p>`
    : '';

  const footerHtml = input.footerNote
    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a;">${escapeHtml(input.footerNote)}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.heading)}</title>
  </head>
  <body style="margin:0;padding:24px 12px;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:10px;">
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 24px;font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#4c1d95;">Super Family Quest</p>
          <h1 style="margin:0 0 20px;font-size:21px;line-height:1.3;color:#18181b;">${escapeHtml(input.heading)}</h1>
          ${paragraphsHtml}
          ${ctaHtml}
          ${footerHtml}
        </td>
      </tr>
    </table>
    <p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.6;color:#a1a1aa;text-align:center;">
      Você recebeu este e-mail porque tem uma conta no Super Family Quest.
    </p>
  </body>
</html>`;

  const textParts = [
    'SUPER FAMILY QUEST',
    '',
    input.heading,
    '',
    ...input.paragraphs,
  ];

  if (input.cta) {
    textParts.push('', `${input.cta.label}: ${input.cta.url}`);
  }

  if (input.footerNote) {
    textParts.push('', input.footerNote);
  }

  return { html, text: textParts.join('\n') };
}
