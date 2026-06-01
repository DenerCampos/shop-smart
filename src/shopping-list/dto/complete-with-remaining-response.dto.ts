import { Expose, Type } from 'class-transformer';
import { ShoppingListResponseDto } from './shopping-list-response.dto';

export class CompleteWithRemainingResponseDto {
  @Expose()
  @Type(() => ShoppingListResponseDto)
  completed: ShoppingListResponseDto;

  @Expose()
  @Type(() => ShoppingListResponseDto)
  newList: ShoppingListResponseDto;
}
