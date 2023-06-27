import {
  IsArray,
  IsEmpty,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { itemType } from '../types/itemType';
import { CreateItemDto } from './createItem.dto';
import { Store } from 'src/store/entities/store.entity';

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  number: string;

  @IsNotEmpty()
  store: number;

  @IsString()
  url: string;

  @ValidateNested()
  @IsArray()
  @Type(() => CreateItemDto)
  items: itemType[];
}
