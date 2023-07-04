import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateCouponDto } from './createCoupan.dto';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UpdateItemDto } from './updateItem.dto';
import { itemType } from '../types/itemType';
import { UpdatePaymentDto } from 'src/payment/dto/updatePayment.dto';
import { paymentType } from 'src/payment/types/paymentType';
import { UpdateStoreDto } from 'src/store/dto/updateStore.dto';
import { storeType } from 'src/store/types/storeType';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  @IsOptional()
  number: string;

  @IsString()
  @IsOptional()
  url: string;

  @IsDateString()
  @IsOptional()
  date: Date;

  @ValidateNested()
  @Type(() => UpdateStoreDto)
  @IsOptional()
  store: storeType;

  @ValidateNested()
  @IsArray()
  @Type(() => UpdateItemDto)
  @IsOptional()
  items: itemType[];

  @ValidateNested()
  @Type(() => UpdatePaymentDto)
  @IsOptional()
  payment: paymentType;
}
