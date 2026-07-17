import { Logger } from '@nestjs/common';

const logger = new Logger('PdfParserUtil');

export interface ParsePdfTextOptions {
  /** ID do processamento de exame (para rastreio nos logs). */
  processingId?: string;
}

export interface ParsePdfTextResult {
  text: string;
  pageCount: number;
}

/**
 * Extrai o texto de um buffer PDF usando pdf-parse v2 (PDFParse).
 * Retorna string vazia se o parse falhar ou o buffer for inválido.
 */
export async function parsePdfText(
  buffer: Buffer,
  options?: ParsePdfTextOptions,
): Promise<string> {
  const result = await parsePdf(buffer, options);
  return result.text;
}

/** Extrai texto e metadados básicos do PDF (com logs estruturados). */
export async function parsePdf(
  buffer: Buffer,
  options?: ParsePdfTextOptions,
): Promise<ParsePdfTextResult> {
  const processingId = options?.processingId ?? 'n/a';
  const bufferBytes = buffer?.length ?? 0;

  logger.log(
    JSON.stringify({
      event: 'pdf_parse_start',
      processingId,
      bufferBytes,
    }),
  );

  if (!buffer?.length) {
    logger.warn(
      JSON.stringify({
        event: 'pdf_parse_failed',
        processingId,
        bufferBytes,
        reason: 'empty_buffer',
      }),
    );
    return { text: '', pageCount: 0 };
  }

  let parser: {
    getText: () => Promise<{ text?: string; total?: number }>;
    destroy: () => Promise<void>;
  } | null = null;

  try {
    const { PDFParse } = await import('pdf-parse');
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = (result.text ?? '').trim();
    const pageCount = result.total ?? 0;

    logger.log(
      JSON.stringify({
        event: 'pdf_parse_ok',
        processingId,
        bufferBytes,
        textLength: text.length,
        nPages: pageCount,
        preview: text.slice(0, 120).replace(/\s+/g, ' '),
      }),
    );

    return { text, pageCount };
  } catch (error) {
    logger.warn(
      JSON.stringify({
        event: 'pdf_parse_failed',
        processingId,
        bufferBytes,
        reason: error instanceof Error ? error.message : String(error),
      }),
    );
    return { text: '', pageCount: 0 };
  } finally {
    if (parser) {
      await parser.destroy().catch(() => null);
    }
  }
}
