import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

  @IsOptional()
  @IsString()
  installmentGroupId?: string | null;

  @IsOptional()
  @IsNumber()
  installmentNumber?: number | null;

  @IsOptional()
  @IsNumber()
  totalInstallments?: number | null;

  @IsOptional()
  @IsBoolean()
  isInstallment?: boolean;

  @IsOptional()
  photos?: string[];
}
