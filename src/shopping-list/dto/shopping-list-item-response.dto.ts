import { Exclude, Expose, Type } from 'class-transformer';
import { GroupResponseDto } from 'src/group/dto/group-response.dto';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';

/** Mesmo padrão de `ItemResponseDto` (expense): relações aninhadas com @Type, não só @Transform. */
export class ShoppingListItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  quantity: number;

  @Expose()
  unit: string;

  @Expose()
  status: string;

  @Expose()
  @Type(() => GroupResponseDto)
  group: GroupResponseDto | null;

  @Expose()
  @Type(() => OwnerResponseDto)
  addedBy: OwnerResponseDto | null;

  @Expose()
  @Type(() => OwnerResponseDto)
  checkedBy: OwnerResponseDto | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
