import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MissionDefinition } from '../entities/mission-definition.entity';
import { IMissionDefinitionRepository } from '../interfaces/mission-definition.repository.interface';

@Injectable()
export class MissionDefinitionRepository
  implements IMissionDefinitionRepository
{
  constructor(
    @InjectRepository(MissionDefinition)
    private readonly repo: Repository<MissionDefinition>,
  ) {}

  findAll(): Promise<MissionDefinition[]> {
    return this.repo.find({ where: { isActive: true } });
  }

  findByKey(key: string): Promise<MissionDefinition | null> {
    return this.repo.findOne({ where: { key, isActive: true } });
  }

  findById(id: string): Promise<MissionDefinition | null> {
    return this.repo.findOne({ where: { id } });
  }
}
