import { IsNumber, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateCoinDto } from './createCoin.dto';

export class UpdateCoinDto extends PartialType(CreateCoinDto) {
  @IsOptional()
  @IsNumber()
  balance: number;

  @IsOptional()
  @IsNumber()
  totalEarned: number;

  @IsOptional()
  @IsNumber()
  totalSpent: number;
}
