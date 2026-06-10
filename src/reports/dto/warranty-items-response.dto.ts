import { Expose, Type } from 'class-transformer';
import { WarrantyItemResponseDto } from './warranty-item-response.dto';

export class WarrantyItemsResponseDto {
  @Expose()
  @Type(() => WarrantyItemResponseDto)
  data: WarrantyItemResponseDto[];

  @Expose()
  meta: {
    itemCount: number;
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };

  @Expose()
  links: {
    first: string;
    previous: string | null;
    next: string | null;
    last: string;
  };
}
