import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FinancialRecurrenceBlockDto } from 'src/common/dto/financial-recurrence.dto';
import { CreatePaymentDto } from 'src/payment/dto/create-payment.dto';
import { paymentType } from 'src/payment/types/paymentType';
import { CreateStoreDto } from 'src/store/dto/create-store.dto';
import { storeType } from 'src/store/types/storeType';
import { CreateItemDto } from './create-item.dto';
import { itemType } from '../types/itemType';
import { capitalizeFirstLetter } from 'src/common/utils/transformString.util';

export class CreateExpenseDto extends FinancialRecurrenceBlockDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;

  @IsOptional()
  @IsBoolean()
  repeat?: boolean;

  @ValidateNested()
  @Type(() => CreateStoreDto)
  @IsNotEmpty()
  store: storeType;

  @IsString()
  uri: string;

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
