import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { HealthExamType } from '../types/health.types';
import { CreateHealthExamItemDto } from './create-health-exam.dto';

export class ApproveProcessingDto {
  @IsOptional()
  @IsString()
  labName?: string;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsDateString()
  examDate?: string;

  @IsOptional()
  @IsEnum(['LABORATORY', 'IMAGING', 'FUNCTIONAL', 'PROCEDURE', 'OTHER'])
  examType?: HealthExamType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHealthExamItemDto)
  items?: CreateHealthExamItemDto[];
}
