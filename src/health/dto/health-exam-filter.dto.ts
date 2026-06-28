import {
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import type { HealthExamType } from '../types/health.types';

export class HealthExamFilterDto {
  @IsOptional()
  @IsString()
  examName?: string;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsString()
  labName?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(['LABORATORY', 'IMAGING', 'FUNCTIONAL', 'PROCEDURE', 'OTHER'])
  examType?: HealthExamType;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
