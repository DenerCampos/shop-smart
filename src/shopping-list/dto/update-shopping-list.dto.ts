import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { capitalizeFirstLetter } from 'src/common/utils/transformString.util';
import { ShoppingListStatus } from '../types/shopping-list-status.type';

export class UpdateShoppingListDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name?: string;

  @IsOptional()
  @IsEnum(['active', 'completed', 'archived'])
  status?: ShoppingListStatus;
}
