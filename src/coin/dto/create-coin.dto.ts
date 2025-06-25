import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateCoinDto {
  @IsNotEmpty()
  @IsNumber()
  balance: number;

  @IsNotEmpty()
  @IsNumber()
  totalEarned: number;

  @IsNotEmpty()
  @IsNumber()
  totalSpent: number;
}
