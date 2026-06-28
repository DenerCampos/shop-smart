import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrescriptionItemDto {
  @IsString()
  medicationName: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scheduleTimes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  daysOfWeek?: string[] | null;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateHealthPrescriptionDto {
  @IsString()
  doctorName: string;

  @IsDateString()
  prescriptionDate: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items?: CreatePrescriptionItemDto[];
}
