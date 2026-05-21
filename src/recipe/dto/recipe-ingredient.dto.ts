import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class RecipeIngredientDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  quantity: number;

  @IsNotEmpty()
  @IsString()
  unit: string;
}
