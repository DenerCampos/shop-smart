import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class BulkAddShoppingListItemDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  text: string;
}
