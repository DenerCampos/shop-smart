import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { CreateExpenseDto } from './create-expense.dto';

export class ExpenseRecurringConfirmDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateExpenseDto)
  expenses: CreateExpenseDto[];

  @IsArray()
  @ArrayNotEmpty()
  expenseIds: string[];
}
