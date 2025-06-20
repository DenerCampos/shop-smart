import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { CreateExpenseDto } from './create-expense.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @IsOptional()
  name: string;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsBoolean()
  repeat: boolean;
}
