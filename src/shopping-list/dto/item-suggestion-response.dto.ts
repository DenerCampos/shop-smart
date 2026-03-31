import { Expose } from 'class-transformer';

export class ItemSuggestionResponseDto {
  @Expose()
  name: string;

  @Expose()
  suggestedGroup: string | null;

  @Expose()
  suggestedUnit: string | null;

  @Expose()
  frequency: number;
}
