import { buildEmailLayout, EmailContent } from './email-layout.template';

export interface WelcomeTemplateInput {
  name: string;
  appUrl: string;
}

export function buildWelcomeEmail(input: WelcomeTemplateInput): EmailContent {
  const { html, text } = buildEmailLayout({
    heading: 'Bem-vindo ao Super Family Quest',
    paragraphs: [
      `Olá, ${input.name}.`,
      'Sua conta foi criada com sucesso. A partir de agora você pode organizar as finanças da casa, montar listas de compras, distribuir tarefas e acompanhar as missões da família em um só lugar.',
      'Um bom primeiro passo é criar seu grupo familiar e convidar as pessoas de casa.',
    ],
    cta: { label: 'Acessar o app', url: input.appUrl },
  });

  return { subject: 'Bem-vindo ao Super Family Quest', html, text };
}
