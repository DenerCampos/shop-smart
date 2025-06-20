import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetValueExpenseCurrentDto {
  @IsNotEmpty()
  @IsNumber()
  value: number;
}
