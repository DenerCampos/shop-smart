import { Request } from 'express';

/** Normaliza IPv6 mapeado e loopback para leitura humana nos logs. */
export function normalizeClientIp(ip: string | undefined): string | undefined {
  if (ip == null || ip === '') return undefined;
  const trimmed = ip.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('::ffff:')) return trimmed.slice(7);
  if (trimmed === '::1') return '127.0.0.1';
  return trimmed;
}

/**
 * IP do cliente HTTP. Com `trust proxy` configurado no Express (via API_TRUST_PROXY_HOPS),
 * `req.ip` reflete cabeçalhos encadeados (ex.: X-Forwarded-For) de forma segura.
 */
export function getClientIp(req: Request): string | undefined {
  const fromExpress = typeof req.ip === 'string' && req.ip ? req.ip : undefined;
  const fromSocket = req.socket?.remoteAddress;
  const raw = fromExpress || fromSocket;
  return normalizeClientIp(raw);
}
