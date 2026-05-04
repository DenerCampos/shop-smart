import { Request } from 'express';
import { getClientIp, normalizeClientIp } from './client-ip.util';

function mockReq(partial: Partial<Request>): Request {
  return partial as Request;
}

describe('normalizeClientIp', () => {
  it('remove prefixo IPv6 mapeado', () => {
    expect(normalizeClientIp('::ffff:192.168.1.1')).toBe('192.168.1.1');
  });

  it('normaliza loopback IPv6', () => {
    expect(normalizeClientIp('::1')).toBe('127.0.0.1');
  });

  it('retorna undefined para vazio', () => {
    expect(normalizeClientIp('')).toBeUndefined();
    expect(normalizeClientIp('   ')).toBeUndefined();
    expect(normalizeClientIp(undefined)).toBeUndefined();
  });
});

describe('getClientIp', () => {
  it('prefere req.ip quando definido', () => {
    const req = mockReq({
      ip: '10.0.0.5',
      socket: { remoteAddress: '172.18.0.1' } as Request['socket'],
    });
    expect(getClientIp(req)).toBe('10.0.0.5');
  });

  it('usa socket quando req.ip ausente', () => {
    const req = mockReq({
      socket: { remoteAddress: '::ffff:203.0.113.1' } as Request['socket'],
    });
    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('ignora req.ip string vazia e cai no socket', () => {
    const req = mockReq({
      ip: '',
      socket: { remoteAddress: '192.168.0.2' } as Request['socket'],
    });
    expect(getClientIp(req)).toBe('192.168.0.2');
  });
});
