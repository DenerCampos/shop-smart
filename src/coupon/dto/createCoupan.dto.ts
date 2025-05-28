import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { itemType } from '../types/itemType';
import { CreateItemDto } from './createItem.dto';
import { CreateStoreDto } from 'src/store/dto/createStore.dto';
import { storeType } from 'src/store/types/storeType';
import { CreatePaymentDto } from 'src/payment/dto/createPayment.dto';
import { paymentType } from 'src/payment/types/paymentType';

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  number: string;

  @ValidateNested()
  @Type(() => CreateStoreDto)
  @IsNotEmpty()
  store: storeType;

  @IsString()
  url: string;

  @IsNumber()
  @IsOptional()
  value: number;

  @IsNotEmpty()
  @IsDateString()
  date: Date;

  @ValidateNested()
  @IsArray()
  @Type(() => CreateItemDto)
  items: itemType[];

  @ValidateNested()
  @Type(() => CreatePaymentDto)
  @IsNotEmpty()
  payment: paymentType;
}
