import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchUsersQueryDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;
}
