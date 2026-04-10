import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  SHOPPING_LIST_ITEM_UNITS,
  ShoppingListItemUnit,
} from '../types/shopping-list-item-unit.type';
import { normalizeShoppingListItemUnit } from '../utils/normalize-shopping-list-item-unit';

export class CreateShoppingListItemDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => parseFloat(value))
  quantity?: number = 1;

  @IsOptional()
  @Transform(({ value }) => normalizeShoppingListItemUnit(value))
  @IsIn(SHOPPING_LIST_ITEM_UNITS)
  unit?: ShoppingListItemUnit = 'un';

  @IsOptional()
  @IsUUID()
  groupId?: string;

  /** Se true, interpreta `name` com Gemini (quantidade, unidade, categoria). */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return true;
    }
    return false;
  })
  useTextRecognition?: boolean;
}
