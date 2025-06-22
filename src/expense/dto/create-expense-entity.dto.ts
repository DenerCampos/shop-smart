import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateExpenseEntityDto {
  @IsNotEmpty()
  @IsString()
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
