import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { coinType } from '../types/coinType';

export class RemoveCoinDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['imagem', 'theme', 'color'])
  type: coinType;
}
