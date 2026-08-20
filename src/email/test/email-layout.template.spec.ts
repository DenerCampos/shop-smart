import {
  buildEmailLayout,
  escapeHtml,
  toAbsoluteUrl,
} from '../templates/email-layout.template';

describe('escapeHtml', () => {
  it('neutraliza markup vindo de entrada do usuário', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('escapa aspas e ampersand', () => {
    expect(escapeHtml(`"Fam & Cia" 'x'`)).toBe(
      '&quot;Fam &amp; Cia&quot; &#39;x&#39;',
    );
  });
});

describe('toAbsoluteUrl', () => {
  it('mantém URL que já é absoluta', () => {
    expect(toAbsoluteUrl('http://localhost:5173', 'https://x.com/y')).toBe(
      'https://x.com/y',
    );
  });

  it('junta caminho relativo com a base', () => {
    expect(toAbsoluteUrl('http://localhost:5173', '/home')).toBe(
      'http://localhost:5173/home',
    );
  });

  it('não duplica barras', () => {
    expect(toAbsoluteUrl('http://localhost:5173/', 'home')).toBe(
      'http://localhost:5173/home',
    );
  });
});

describe('buildEmailLayout', () => {
  it('escapa nome de grupo no HTML mas mantém legível no texto', () => {
    const { html, text } = buildEmailLayout({
      heading: 'Convite',
      paragraphs: ['Grupo "<b>Silva</b>"'],
    });

    expect(html).toContain('&lt;b&gt;Silva&lt;/b&gt;');
    expect(html).not.toContain('<b>Silva</b>');
    expect(text).toContain('Grupo "<b>Silva</b>"');
  });

  it('inclui o link do CTA também em texto puro', () => {
    const { html, text } = buildEmailLayout({
      heading: 'Convite',
      paragraphs: ['Corpo'],
      cta: { label: 'Abrir', url: 'https://app/x' },
    });

    expect(html).toContain('href="https://app/x"');
    expect(text).toContain('Abrir: https://app/x');
  });

  it('omite o bloco de CTA quando não há link', () => {
    const { html } = buildEmailLayout({
      heading: 'Aviso',
      paragraphs: ['Corpo'],
    });

    expect(html).not.toContain('<a href');
  });
});
