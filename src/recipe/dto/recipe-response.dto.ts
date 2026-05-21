import { Exclude, Expose, Type } from 'class-transformer';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';
import { FamilyGroupSummaryResponseDto } from 'src/shopping-list/dto/family-group-summary-response.dto';
import type { RecipeIngredient } from '../entities/recipe.entity';

export class RecipeResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  description: string | null;

  @Expose()
  ingredients: RecipeIngredient[];

  @Expose()
  instructions: string;

  @Expose()
  photos: string[];

  @Expose()
  @Type(() => FamilyGroupSummaryResponseDto)
  familyGroup: FamilyGroupSummaryResponseDto | null;

  @Expose()
  @Type(() => OwnerResponseDto)
  createdBy: OwnerResponseDto | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
