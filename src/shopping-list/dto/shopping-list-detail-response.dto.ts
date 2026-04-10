import { Exclude, Expose, Type } from 'class-transformer';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';
import { FamilyGroupSummaryResponseDto } from './family-group-summary-response.dto';
import { ShoppingListItemResponseDto } from './shopping-list-item-response.dto';

/**
 * Montado no service com objeto plano + mapToDto (sem @Transform em cima de `obj` da entidade).
 * Contagens e itemsByCategory vêm explícitas no plain; familyGroup/createdBy usam @Type.
 */
export class ShoppingListDetailResponseDto {
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
  itemsCount: number;

  @Expose()
  pendingCount: number;

  @Expose()
  inCartCount: number;

  @Expose()
  itemsByCategory: Record<string, ShoppingListItemResponseDto[]>;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
