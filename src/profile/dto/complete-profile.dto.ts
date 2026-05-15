import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
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
  @Min(1)
  income?: number;

  @ValidateIf((o: CompleteProfileDto) => o.income != null)
  @IsNotEmpty()
  @IsString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  repeatMonthly?: boolean;
}
