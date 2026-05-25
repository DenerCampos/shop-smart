import { Expose } from 'class-transformer';

export class MissionClaimResponseDto {
  @Expose()
  success: boolean;
}
