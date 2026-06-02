import { IsIn, IsNotEmpty, IsString } from 'class-validator';

/** Tipos expostos em `POST /coin/addCoins` (créditos automáticos internos usam `coinType` no service). */
export const ADD_COIN_HTTP_TYPES = ['coupon'] as const;
export type AddCoinHttpType = (typeof ADD_COIN_HTTP_TYPES)[number];

export class AddCoinDto {
  @IsNotEmpty()
  @IsString()
  @IsIn([...ADD_COIN_HTTP_TYPES])
  type: AddCoinHttpType;
}
