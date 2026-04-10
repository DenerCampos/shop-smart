import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';
import { FamilyGroupSummaryResponseDto } from './family-group-summary-response.dto';

/** Alinhado a ExpenseResponseDto: relações com @Type, não só @Transform no plain. */
export class ShoppingListResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  status: string;

  @Expose()
  @Type(() => FamilyGroupSummaryResponseDto)
  familyGroup: FamilyGroupSummaryResponseDto | null;

  @Expose()
  @Type(() => OwnerResponseDto)
  createdBy: OwnerResponseDto | null;

  @Expose()
  @Transform(({ obj }) => obj.items?.length ?? 0)
  itemsCount: number;

  @Expose()
  @Transform(
    ({ obj }) => obj.items?.filter((i) => i.status === 'pending').length ?? 0,
  )
  pendingCount: number;

  @Expose()
  @Transform(
    ({ obj }) => obj.items?.filter((i) => i.status === 'in_cart').length ?? 0,
  )
  inCartCount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
