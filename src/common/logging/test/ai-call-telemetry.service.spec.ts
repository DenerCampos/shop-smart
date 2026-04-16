import { Logger } from '@nestjs/common';
import { AiCallTelemetryService } from '../ai-call-telemetry.service';
import { ApiQuotaException } from '../../ai-quota/exceptions/apiQuota.exception';
import * as logEventUtil from '../log-event.util';

describe('AiCallTelemetryService', () => {
  let service: AiCallTelemetryService;
  let logJsonSpy: jest.SpyInstance;

  beforeEach(() => {
    logJsonSpy = jest.spyOn(logEventUtil, 'logJson').mockImplementation();
    service = new AiCallTelemetryService();
  });

  afterEach(() => {
    logJsonSpy.mockRestore();
  });

  it('measure retorna resultado e loga sucesso', async () => {
    const result = await service.measure(
      'image_recognition',
      'gemini',
      async () => 'ok',
    );
    expect(result).toBe('ok');
    expect(logJsonSpy).toHaveBeenCalledWith(
      expect.any(Logger),
      expect.objectContaining({
        event: 'ai_provider_call',
        feature: 'image_recognition',
        provider: 'gemini',
        ok: true,
      }),
    );
    expect(
      (logJsonSpy.mock.calls[0][1] as { duration_ms: number }).duration_ms,
    ).toBeGreaterThanOrEqual(0);
  });

  it('measure em ApiQuotaException loga falha quota e relança', async () => {
    const err = new ApiQuotaException('limite', 'gemini', 50, 50);
    await expect(
      service.measure('text_recognition', 'gemini', async () => {
        throw err;
      }),
    ).rejects.toBe(err);

    expect(logJsonSpy).toHaveBeenCalledWith(
      expect.any(Logger),
      expect.objectContaining({
        ok: false,
        failure: 'quota',
        feature: 'text_recognition',
      }),
      'warn',
    );
  });

  it('measure em erro genérico loga failure unknown e relança', async () => {
    const err = new Error('boom');
    await expect(
      service.measure('audio_recognition', 'x', async () => {
        throw err;
      }),
    ).rejects.toBe(err);

    expect(logJsonSpy).toHaveBeenCalledWith(
      expect.any(Logger),
      expect.objectContaining({
        ok: false,
        failure: 'unknown',
        error_message: 'boom',
      }),
      'warn',
    );
  });
});
