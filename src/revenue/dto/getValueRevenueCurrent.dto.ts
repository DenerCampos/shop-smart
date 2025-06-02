import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetValueRevenueCurrentDto {
  @IsNotEmpty()
  @IsNumber()
  value: number;
}
