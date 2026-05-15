import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ChoreDefinitionResponseDto } from './chore-definition-response.dto';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';
import { occurrenceStatusToApi } from '../utils/chore-status-api';

@Exclude()
export class ChoreOccurrenceResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Transform(({ obj }) => occurrenceStatusToApi(obj.status))
  status: string;

  @Expose()
  snapshotRewardMoney: number | null;

  @Expose()
  snapshotCoinReward: number | null;

  @Expose()
  photoBeforeUrl: string | null;

  @Expose()
  photoAfterUrl: string | null;

  @Expose()
  rejectionReason: string | null;

  @Expose()
  earnedPeriodYm: number | null;

  @Expose()
  submittedAt: Date | null;

  @Expose()
  approvedAt: Date | null;

  @Expose()
  completedAt: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  scheduledDate: Date | null;

  @Expose()
  @Type(() => OwnerResponseDto)
  assignedTo: OwnerResponseDto | null;

  @Expose()
  @Type(() => ChoreDefinitionResponseDto)
  definition: ChoreDefinitionResponseDto;
}
