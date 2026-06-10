import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CreateExpenseDto } from './create-expense.dto';
import { PartialType } from '@nestjs/swagger';
import { UpdateStoreDto } from 'src/store/dto/update-store.dto';
import { Transform, Type } from 'class-transformer';
import { storeType } from 'src/store/types/storeType';
import { UpdateItemDto } from './update-item.dto';
import { itemType } from '../types/itemType';
import { UpdatePaymentDto } from 'src/payment/dto/update-payment.dto';
import { paymentType } from 'src/payment/types/paymentType';
import { capitalizeFirstLetter } from 'src/common/utils/transformString.util';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedItemIds?: string[];
}
