import { Exclude, Expose } from 'class-transformer';
import { ChoreRecurrence } from '../types/chore-recurrence.type';

@Exclude()
export class ChoreDefinitionResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string | null;

  @Expose()
  rewardValue: number;

  @Expose()
  coinReward: number;

  @Expose()
  requirePhoto: boolean;

  @Expose()
  recurrence: ChoreRecurrence;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;
}
