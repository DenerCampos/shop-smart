import { Injectable, Inject } from '@nestjs/common';
import { IApiUsageRepository } from '../interfaces/apiUsage.repository.interface';
import { ApiQuotaException } from '../exceptions/apiQuota.exception';

@Injectable()
export class ApiQuotaService {
  constructor(
    @Inject('IApiUsageRepository')
    private readonly apiUsageRepository: IApiUsageRepository,
  ) {}

  /**
   * Verifica se o provedor ainda tem quota disponível para hoje
   * @param provider Nome do provedor (ex: 'gemini')
   * @param dailyLimit Limite diário de requisições
   * @returns true se ainda tem quota disponível
   * @throws ApiQuotaException se o limite foi atingido
   */
  async checkAndIncrementQuota(
    provider: string,
    dailyLimit: number,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let usage = await this.apiUsageRepository.findByProviderAndDate(
      provider,
      today,
    );

    if (!usage) {
      // Cria um novo registro para hoje
      usage = await this.apiUsageRepository.create({
        provider,
        date: today,
        requestCount: 0,
        dailyLimit,
      });
    }

    if (usage.requestCount >= dailyLimit) {
      throw new ApiQuotaException(
        `Limite diário de ${dailyLimit} requisições para o provedor ${provider} foi atingido. Tente novamente amanhã.`,
        provider,
        dailyLimit,
        usage.requestCount,
      );
    }

    // Incrementa o contador
    await this.apiUsageRepository.incrementCount(usage.id);
  }

  /**
   * Retorna o uso atual do provedor para hoje
   * @param provider Nome do provedor
   * @returns Objeto com informações de uso
   */
  async getCurrentUsage(provider: string): Promise<{
    requestCount: number;
    dailyLimit: number;
    remaining: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await this.apiUsageRepository.findByProviderAndDate(
      provider,
      today,
    );

    if (!usage) {
      return {
        requestCount: 0,
        dailyLimit: 0,
        remaining: 0,
      };
    }

    return {
      requestCount: usage.requestCount,
      dailyLimit: usage.dailyLimit,
      remaining: Math.max(0, usage.dailyLimit - usage.requestCount),
    };
  }
}
