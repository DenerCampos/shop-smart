import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiUsage } from '../entities/apiUsage.entity';
import { IApiUsageRepository } from '../interfaces/apiUsage.repository.interface';

@Injectable()
export class ApiUsageRepository implements IApiUsageRepository {
  constructor(
    @InjectRepository(ApiUsage)
    private readonly apiUsageRepository: Repository<ApiUsage>,
  ) {}

  async findByProviderAndDate(
    provider: string,
    date: Date,
  ): Promise<ApiUsage | null> {
    return await this.apiUsageRepository.findOne({
      where: {
        provider,
        date,
      },
    });
  }

  async create(data: Partial<ApiUsage>): Promise<ApiUsage> {
    const apiUsage = this.apiUsageRepository.create(data);
    return await this.apiUsageRepository.save(apiUsage);
  }

  async incrementCount(id: string): Promise<void> {
    await this.apiUsageRepository.increment({ id }, 'requestCount', 1);
  }
}
