import { MissionDefinition } from '../entities/mission-definition.entity';

export interface IMissionDefinitionRepository {
  findAll(): Promise<MissionDefinition[]>;
  findByKey(key: string): Promise<MissionDefinition | null>;
  findById(id: string): Promise<MissionDefinition | null>;
}
