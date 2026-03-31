import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ShoppingListItemStatus } from '../types/shopping-list-item-status.type';
import {
  SHOPPING_LIST_ITEM_UNITS,
  ShoppingListItemUnit,
} from '../types/shopping-list-item-unit.type';
import { normalizeShoppingListItemUnit } from '../utils/normalize-shopping-list-item-unit';

export class UpdateShoppingListItemDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  quantity?: number;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : normalizeShoppingListItemUnit(value),
  )
  @IsIn(SHOPPING_LIST_ITEM_UNITS)
  unit?: ShoppingListItemUnit;

  @IsOptional()
  @IsEnum(['pending', 'in_cart'])
  status?: ShoppingListItemStatus;

  @IsOptional()
  @IsUUID()
  groupId?: string;
}
