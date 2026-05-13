import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CompleteProfileDto {
  @ValidateIf((o: CompleteProfileDto) => o.income != null)
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsString()
  family: string;

  @IsOptional()
  @IsNumber()
  income?: number;

  @ValidateIf((o: CompleteProfileDto) => o.income != null)
  @IsNotEmpty()
  @IsString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  repeatMonthly?: boolean;
}
