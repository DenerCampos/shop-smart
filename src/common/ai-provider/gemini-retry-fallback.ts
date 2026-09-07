export const GEMINI_VISION_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-flash',
] as const;

export type GeminiVisionModel = (typeof GEMINI_VISION_MODELS)[number];

const DEFAULT_ATTEMPTS_PER_MODEL = 2;
const DEFAULT_DELAY_MS = 700;

export function getGeminiErrorHttpStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    if (typeof status === 'number' && Number.isFinite(status)) {
      return status;
    }
    if (typeof status === 'string' && /^\d{3}$/.test(status.trim())) {
      return Number(status.trim());
    }
  }
  const message = err instanceof Error ? err.message : String(err);
  const bracket = message.match(/\[(\d{3})\s/);
  return bracket ? Number(bracket[1]) : undefined;
}

export function isUnavailableGeminiModelError(err: unknown): boolean {
  const status = getGeminiErrorHttpStatus(err);
  if (status === 404) {
    return true;
  }
  const message = (
    err instanceof Error ? err.message : String(err)
  ).toLowerCase();
  return (
    message.includes('no longer available') ||
    (message.includes('models/') && message.includes('not found'))
  );
}

export function isRateLimitedGeminiError(err: unknown): boolean {
  const status = getGeminiErrorHttpStatus(err);
  if (status === 429) {
    return true;
  }
  const message = (
    err instanceof Error ? err.message : String(err)
  ).toLowerCase();
  return (
    message.includes('resource_exhausted') ||
    message.includes('too many requests') ||
    message.includes('rate limit')
  );
}

export function isRetryableGeminiError(err: unknown): boolean {
  if (isRateLimitedGeminiError(err) || isUnavailableGeminiModelError(err)) {
    return false;
  }
  const status = getGeminiErrorHttpStatus(err);
  if (status === 503 || status === 504) {
    return true;
  }
  const message = (
    err instanceof Error ? err.message : String(err)
  ).toLowerCase();
  return (
    message.includes('high demand') ||
    message.includes('service unavailable') ||
    message.includes('overloaded') ||
    message.includes('try again later') ||
    message.includes('etimedout') ||
    message.includes('deadline_exceeded')
  );
}

export type RetryFallbackSleep = (ms: number) => Promise<void>;

export async function generateWithRetryFallback<T>(
  models: readonly string[],
  run: (model: string) => Promise<T>,
  options?: {
    attemptsPerModel?: number;
    delayMs?: number;
    sleep?: RetryFallbackSleep;
  },
): Promise<{ value: T; model: string; attempts: number }> {
  if (models.length === 0) {
    throw new Error('Nenhum modelo Gemini configurado para fallback');
  }

  const attemptsPerModel =
    options?.attemptsPerModel ?? DEFAULT_ATTEMPTS_PER_MODEL;
  const delayMs = options?.delayMs ?? DEFAULT_DELAY_MS;
  const sleep =
    options?.sleep ??
    ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  let lastError: unknown;
  let attempts = 0;

  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex];
    for (let attempt = 0; attempt < attemptsPerModel; attempt++) {
      attempts += 1;
      try {
        const value = await run(model);
        return { value, model, attempts };
      } catch (err) {
        lastError = err;
        const skipToNextModel =
          isUnavailableGeminiModelError(err) || isRateLimitedGeminiError(err);
        if (skipToNextModel) {
          const isLastModel = modelIndex === models.length - 1;
          if (isLastModel) {
            throw err;
          }
          break;
        }
        if (!isRetryableGeminiError(err)) {
          throw err;
        }
        const isLast =
          modelIndex === models.length - 1 && attempt === attemptsPerModel - 1;
        if (isLast) {
          throw err;
        }
        await sleep(delayMs * (attempt + 1));
      }
    }
  }

  throw lastError;
}
