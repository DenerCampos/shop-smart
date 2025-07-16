import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { capitalizeFirstLetter } from 'src/common/utils/transformString.util';

export class CreateExpenseEntityDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsNotEmpty()
  @IsBoolean()
  repeat: boolean;

  @IsString()
  uri: string;

  @IsNotEmpty()
  @IsDateString()
  date: Date;
}
