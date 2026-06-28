import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { HealthExamType } from '../types/health.types';

export class CreateHealthExamItemDto {
  @IsString()
  itemName: string;

  @IsOptional()
  @IsString()
  material?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  resultValue?: string;

  @IsOptional()
  @IsString()
  resultUnit?: string;

  @IsOptional()
  @IsString()
  referenceRange?: string;

  @IsOptional()
  @IsBoolean()
  isAbnormal?: boolean;

  @IsOptional()
  @IsString()
  itemNotes?: string;

  @IsOptional()
  @IsString()
  findings?: string;

  @IsOptional()
  @IsString()
  conclusion?: string;
}

export class CreateHealthExamDto {
  @IsOptional()
  @IsString()
  labName?: string;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsDateString()
  examDate?: string;

  @IsEnum(['LABORATORY', 'IMAGING', 'FUNCTIONAL', 'PROCEDURE', 'OTHER'])
  examType: HealthExamType;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Para quem o exame pertence (admin pode definir outro userId) */
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHealthExamItemDto)
  items?: CreateHealthExamItemDto[];
}
