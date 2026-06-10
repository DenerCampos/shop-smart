import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateItemEntityDto {
  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  total: number;

  @IsOptional()
  @IsNumber()
  warrantyDuration?: number | null;

  @IsOptional()
  @IsString()
  warrantyUnit?: string | null;

  @IsOptional()
  warrantyExpiresAt?: Date | null;
}
