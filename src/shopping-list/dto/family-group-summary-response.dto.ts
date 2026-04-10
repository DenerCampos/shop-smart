import { Exclude, Expose } from 'class-transformer';

/** Mesmo padrão de OwnerResponseDto: só id/name entram no plain. */
@Exclude()
export class FamilyGroupSummaryResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}
