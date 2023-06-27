import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { itemType } from '../types/itemType';
import { CreateItemDto } from './createItem.dto';
import { CreateStoreDto } from 'src/store/dto/createStore.dto';
import { storeType } from 'src/store/types/storeType';

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  number: string;

  @ValidateNested()
  @Type(() => CreateStoreDto)
  store: storeType;

  @IsString()
  url: string;

  @ValidateNested()
  @IsArray()
  @Type(() => CreateItemDto)
  items: itemType[];
}
