import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class HealthPrescriptionFilterDto {
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
