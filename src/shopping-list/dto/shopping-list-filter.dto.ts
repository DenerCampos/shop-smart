import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ShoppingListStatus } from '../types/shopping-list-status.type';

export class ShoppingListFilterDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['active', 'completed', 'archived'])
  status?: ShoppingListStatus;
}
