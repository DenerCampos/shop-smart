import {
  generateWithRetryFallback,
  getGeminiErrorHttpStatus,
  isRateLimitedGeminiError,
  isRetryableGeminiError,
  isUnavailableGeminiModelError,
} from '../gemini-retry-fallback';

function gemini503(): Error & { status: number } {
  const err = new Error(
    '[GoogleGenerativeAI Error]: [503 Service Unavailable] high demand',
  ) as Error & { status: number };
  err.status = 503;
  return err;
}

function gemini404(): Error & { status: number } {
  const err = new Error(
    '[GoogleGenerativeAI Error]: [404 Not Found] This model models/gemini-2.5-flash-lite is no longer available to new users.',
  ) as Error & { status: number };
  err.status = 404;
  return err;
}

function gemini429(): Error & { status: number } {
  const err = new Error(
    '[GoogleGenerativeAI Error]: [429 Too Many Requests] Resource has been exhausted',
  ) as Error & { status: number };
  err.status = 429;
  return err;
}

describe('isRetryableGeminiError', () => {
  it('trata 503 do SDK como retryable', () => {
    expect(isRetryableGeminiError(gemini503())).toBe(true);
    expect(getGeminiErrorHttpStatus(gemini503())).toBe(503);
  });

  it('lê status HTTP quando o SDK envia string', () => {
    const err = new Error('[GoogleGenerativeAI Error]: overloaded') as Error & {
      status: string;
    };
    err.status = '503';
    expect(getGeminiErrorHttpStatus(err)).toBe(503);
    expect(isRetryableGeminiError(err)).toBe(true);
  });

  it('não faz retry em erro de parse', () => {
    expect(isRetryableGeminiError(new SyntaxError('Unexpected token'))).toBe(
      false,
    );
  });

  it('não faz retry em 400', () => {
    const err = new Error('[400 Bad Request]') as Error & { status: number };
    err.status = 400;
    expect(isRetryableGeminiError(err)).toBe(false);
  });

  it('trata 404 de modelo descontinuado como skip, não retry', () => {
    expect(isUnavailableGeminiModelError(gemini404())).toBe(true);
    expect(isRetryableGeminiError(gemini404())).toBe(false);
  });

  it('trata 429 como rate-limit (fallback de modelo), não retry no mesmo modelo', () => {
    expect(isRateLimitedGeminiError(gemini429())).toBe(true);
    expect(isRetryableGeminiError(gemini429())).toBe(false);
  });
});

describe('generateWithRetryFallback', () => {
  it('retorna no primeiro sucesso', async () => {
    const run = jest.fn().mockResolvedValue('ok');
    const sleep = jest.fn().mockResolvedValue(undefined);

    const out = await generateWithRetryFallback(['m1', 'm2'], run, { sleep });

    expect(out).toEqual({ value: 'ok', model: 'm1', attempts: 1 });
    expect(run).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('repete o mesmo modelo em 503 e depois cai no fallback', async () => {
    const run = jest
      .fn()
      .mockRejectedValueOnce(gemini503())
      .mockRejectedValueOnce(gemini503())
      .mockResolvedValueOnce('lite-ok');
    const sleep = jest.fn().mockResolvedValue(undefined);

    const out = await generateWithRetryFallback(['flash', 'lite'], run, {
      attemptsPerModel: 2,
      delayMs: 10,
      sleep,
    });

    expect(out).toEqual({ value: 'lite-ok', model: 'lite', attempts: 3 });
    expect(run.mock.calls.map((c) => c[0])).toEqual(['flash', 'flash', 'lite']);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('esgota modelos e relança o último 503', async () => {
    const run = jest.fn().mockRejectedValue(gemini503());
    const sleep = jest.fn().mockResolvedValue(undefined);

    await expect(
      generateWithRetryFallback(['a', 'b'], run, {
        attemptsPerModel: 1,
        sleep,
      }),
    ).rejects.toMatchObject({ status: 503 });

    expect(run).toHaveBeenCalledTimes(2);
  });

  it('não tenta fallback em erro não retryable', async () => {
    const run = jest.fn().mockRejectedValue(new Error('API key invalid'));
    const sleep = jest.fn().mockResolvedValue(undefined);

    await expect(
      generateWithRetryFallback(['a', 'b'], run, { sleep }),
    ).rejects.toThrow('API key invalid');

    expect(run).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('404 de modelo pula para o próximo sem repetir o modelo morto', async () => {
    const run = jest
      .fn()
      .mockRejectedValueOnce(gemini404())
      .mockResolvedValueOnce('ok-3.5');
    const sleep = jest.fn().mockResolvedValue(undefined);

    const out = await generateWithRetryFallback(
      ['lite-old', 'flash-3.5'],
      run,
      {
        attemptsPerModel: 2,
        sleep,
      },
    );

    expect(out).toEqual({ value: 'ok-3.5', model: 'flash-3.5', attempts: 2 });
    expect(run.mock.calls.map((c) => c[0])).toEqual(['lite-old', 'flash-3.5']);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('429 pula para o próximo modelo sem repetir o mesmo', async () => {
    const run = jest
      .fn()
      .mockRejectedValueOnce(gemini429())
      .mockResolvedValueOnce('ok-flash');
    const sleep = jest.fn().mockResolvedValue(undefined);

    const out = await generateWithRetryFallback(['lite', 'flash'], run, {
      attemptsPerModel: 2,
      sleep,
    });

    expect(out).toEqual({ value: 'ok-flash', model: 'flash', attempts: 2 });
    expect(run.mock.calls.map((c) => c[0])).toEqual(['lite', 'flash']);
    expect(sleep).not.toHaveBeenCalled();
  });
});
