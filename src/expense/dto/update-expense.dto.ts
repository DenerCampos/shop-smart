import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateExpenseDto } from './create-expense.dto';
import { PartialType } from '@nestjs/swagger';
import { UpdateStoreDto } from 'src/store/dto/update-store.dto';
import { Type } from 'class-transformer';
import { storeType } from 'src/store/types/storeType';
import { UpdateItemDto } from './update-item.dto';
import { itemType } from '../types/itemType';
import { UpdatePaymentDto } from 'src/payment/dto/update-payment.dto';
import { paymentType } from 'src/payment/types/paymentType';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsBoolean()
  repeat: boolean;

  @IsOptional()
  @IsString()
  uri: string;

  @IsOptional()
  @IsDateString()
  date: Date;

  @IsOptional()
  @Type(() => UpdateStoreDto)
  store: storeType;

  @IsOptional()
  @IsArray()
  @Type(() => UpdateItemDto)
  items: itemType[];

  @IsOptional()
  @Type(() => UpdatePaymentDto)
  payment: paymentType;
}
