import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { capitalizeFirstLetter } from 'src/common/utils/transformString.util';
import { RecipeIngredientDto } from './recipe-ingredient.dto';

export class CreateRecipeDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeIngredientDto)
  @ArrayMinSize(1)
  ingredients: RecipeIngredientDto[];

  @IsNotEmpty()
  @IsString()
  instructions: string;

  @IsOptional()
  @IsUUID()
  familyGroupId?: string;
}
