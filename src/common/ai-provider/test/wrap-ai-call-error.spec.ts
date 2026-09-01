import { BadRequestException } from '@nestjs/common';
import { ApiQuotaException } from '../../ai-quota/exceptions/apiQuota.exception';
import { AiCallTelemetryService } from '../../logging/ai-call-telemetry.service';
import { AiProviderException } from '../ai-provider.exception';
import { measureThenWrapAiCall, wrapAiCallError } from '../wrap-ai-call-error';

describe('wrapAiCallError', () => {
  it('relança ApiQuotaException', () => {
    const err = new ApiQuotaException('limite', 'gemini', 10, 10);
    expect(() => wrapAiCallError(err)).toThrow(ApiQuotaException);
  });

  it('relança AiProviderException', () => {
    const err = new AiProviderException();
    expect(() => wrapAiCallError(err)).toThrow(AiProviderException);
  });

  it('relança 4xx de validação do cliente', () => {
    const err = new BadRequestException('Texto vazio');
    expect(() => wrapAiCallError(err)).toThrow(BadRequestException);
  });

  it('envolve erro genérico do modelo em AiProviderException', () => {
    expect(() => wrapAiCallError(new Error('gemini timeout'))).toThrow(
      AiProviderException,
    );
  });
});

describe('measureThenWrapAiCall', () => {
  it('deixa o measure ver o erro original e sanitiza depois', async () => {
    const original = new Error('gemini timeout');
    const seen: unknown[] = [];
    const telemetry = {
      measure: async <T>(
        _feature: string,
        _provider: string,
        fn: () => Promise<T>,
      ): Promise<T> => {
        try {
          return await fn();
        } catch (err) {
          seen.push(err);
          throw err;
        }
      },
    } as Pick<AiCallTelemetryService, 'measure'>;

    await expect(
      measureThenWrapAiCall(telemetry, 'text_recognition', 'gemini-text', () =>
        Promise.reject(original),
      ),
    ).rejects.toBeInstanceOf(AiProviderException);

    expect(seen).toEqual([original]);
  });
});
