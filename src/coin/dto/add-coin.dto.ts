import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { coinType } from '../types/coinType';

export class AddCoinDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['coupon', 'group', 'payment', 'store', 'resource'])
  type: coinType;
}
