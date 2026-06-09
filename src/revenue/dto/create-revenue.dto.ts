import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { FinancialRecurrenceBlockDto } from 'src/common/dto/financial-recurrence.dto';
import { capitalizeFirstLetter } from 'src/common/utils/transformString.util';

export class CreateRevenueDto extends FinancialRecurrenceBlockDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsBoolean()
  repeat?: boolean;

  @IsOptional()
  @IsDateString()
  date?: Date;
}
