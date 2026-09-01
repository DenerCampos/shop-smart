import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiQuotaException } from '../ai-quota/exceptions/apiQuota.exception';
import {
  AiCallTelemetryService,
  AiTelemetryFeature,
} from '../logging/ai-call-telemetry.service';
import { AiProviderException } from './ai-provider.exception';

/**
 * Quota (429) e validação do cliente (4xx) passam; falha ao chamar/interpretar
 * o modelo vira 502 `AI_PROVIDER_ERROR` (detalhe só na telemetria).
 */
export function wrapAiCallError(error: unknown): never {
  if (error instanceof ApiQuotaException) {
    throw error;
  }
  if (error instanceof AiProviderException) {
    throw error;
  }
  if (
    error instanceof HttpException &&
    error.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR
  ) {
    throw error;
  }
  throw new AiProviderException();
}

/**
 * Executa a chamada no `measure` (loga o erro original) e só depois sanitiza
 * o HTTP com `wrapAiCallError`.
 */
export async function measureThenWrapAiCall<T>(
  telemetry: Pick<AiCallTelemetryService, 'measure'>,
  feature: AiTelemetryFeature,
  provider: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await telemetry.measure(feature, provider, fn);
  } catch (error) {
    wrapAiCallError(error);
  }
}
