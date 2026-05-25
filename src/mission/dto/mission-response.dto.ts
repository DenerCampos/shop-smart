import { Expose, Type } from 'class-transformer';
import { MissionFrequency } from '../types/mission-frequency.enum';

export class MissionDefinitionDto {
  @Expose()
  id: string;

  @Expose()
  key: string;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  frequency: MissionFrequency;

  @Expose()
  rewardCoins: number;

  @Expose()
  targetValue: number;
}

export class MissionProgressDto {
  @Expose()
  id: string | null;

  @Expose()
  currentValue: number;

  @Expose()
  isCompleted: boolean;

  @Expose()
  isClaimed: boolean;

  @Expose()
  resetAt: Date | null;
}

export class MissionWithProgressResponseDto {
  @Expose()
  @Type(() => MissionDefinitionDto)
  mission: MissionDefinitionDto;

  @Expose()
  @Type(() => MissionProgressDto)
  progress: MissionProgressDto;
}
