import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ItemSuggestionDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  search: string;
}
