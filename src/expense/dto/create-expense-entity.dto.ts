import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreatePaymentDto } from 'src/payment/dto/create-payment.dto';
import { paymentType } from 'src/payment/types/paymentType';
import { CreateStoreDto } from 'src/store/dto/create-store.dto';
import { storeType } from 'src/store/types/storeType';
import { CreateItemDto } from './create-item.dto';
import { itemType } from '../types/itemType';

export class CreateExpenseEntityDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsNotEmpty()
  @IsBoolean()
  repeat: boolean;

  @IsString()
  uri: string;

  @IsNotEmpty()
  @IsDateString()
  date: Date;
}
