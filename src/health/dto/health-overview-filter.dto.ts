import { IsDateString, IsOptional, IsString } from 'class-validator';

export class HealthOverviewFilterDto {
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
