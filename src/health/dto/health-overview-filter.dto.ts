import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class HealthOverviewFilterDto {
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsUUID()
  familyGroupId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
