import { ApiUsage } from '../entities/apiUsage.entity';

export interface IApiUsageRepository {
  findByProviderAndDate(provider: string, date: Date): Promise<ApiUsage | null>;
  create(data: Partial<ApiUsage>): Promise<ApiUsage>;
  incrementCount(id: string): Promise<void>;
}
