import { BadRequestException } from '@nestjs/common';

export interface DownloadUrlOptions {
  maxBytes?: number;
  timeoutMs?: number;
}

const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Baixa uma URL HTTP(S) para buffer com limite de tamanho e timeout.
 */
export async function downloadUrlToBuffer(
  url: string,
  options?: DownloadUrlOptions,
): Promise<Buffer> {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const https = await import('https');
  const http = await import('http');
  const client = url.startsWith('https') ? https : http;

  return new Promise((resolve, reject) => {
    const req = (client as typeof http).get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        res.resume();
        reject(
          new BadRequestException(
            `Falha ao baixar arquivo (HTTP ${res.statusCode}).`,
          ),
        );
        return;
      }

      const chunks: Buffer[] = [];
      let total = 0;

      res.on('data', (chunk: Buffer) => {
        total += chunk.length;
        if (total > maxBytes) {
          req.destroy();
          reject(
            new BadRequestException(
              `Arquivo excede o limite de ${maxBytes} bytes.`,
            ),
          );
          return;
        }
        chunks.push(chunk);
      });

      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new BadRequestException('Timeout ao baixar arquivo.'));
    });
  });
}
