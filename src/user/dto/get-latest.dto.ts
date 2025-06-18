import { IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetLatestDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number;
}
