import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ChoreOccurrenceQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['open', 'waiting_approval', 'completed'])
  status?: 'open' | 'waiting_approval' | 'completed';

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
