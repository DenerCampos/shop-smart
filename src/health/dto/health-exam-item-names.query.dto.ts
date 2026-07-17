import { IsOptional, IsString, MaxLength } from 'class-validator';

export class HealthExamItemNamesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(36)
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;
}
