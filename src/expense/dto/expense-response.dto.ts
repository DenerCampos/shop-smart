import { Exclude, Expose, Type } from 'class-transformer';
import { ItemResponseDto } from './item-response.dto';

export class ExpenseResponseDto {
  @Exclude()
  id: string;

  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  repeat: boolean;

  @Expose()
  date: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  @Expose()
  @Type(() => ItemResponseDto)
  items: ItemResponseDto[];
}
