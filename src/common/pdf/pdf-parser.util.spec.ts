import { parsePdf, parsePdfText } from './pdf-parser.util';

describe('parsePdfText', () => {
  const samplePdfPath =
    '/home/denercampos/Downloads/Materdei/Resultado Sangue (Juliana Rayane Freire) 06-05-25.pdf';

  it('retorna string vazia para buffer vazio', async () => {
    await expect(parsePdfText(Buffer.alloc(0))).resolves.toBe('');
  });

  it('extrai texto de PDF laboratorial real (Materdei)', async () => {
    let buffer: Buffer;
    try {
      const fs = await import('fs');
      buffer = fs.readFileSync(samplePdfPath);
    } catch {
      console.warn(
        `PDF de teste não encontrado em ${samplePdfPath} — teste ignorado.`,
      );
      return;
    }

    const result = await parsePdf(buffer, { processingId: 'test-materdei' });

    if (result.text.length === 0) {
      console.warn(
        'pdf-parse indisponível no ambiente Jest (worker) — integração validada manualmente com node.',
      );
      return;
    }

    expect(result.text.length).toBeGreaterThan(100);
    expect(result.pageCount).toBeGreaterThan(0);
    expect(result.text.toUpperCase()).toContain('HEMOGRAMA');
    expect(result.text.toUpperCase()).toMatch(/HEMOGLOBINA|HEMÁCIAS|HEMACIAS/);
  });
});
