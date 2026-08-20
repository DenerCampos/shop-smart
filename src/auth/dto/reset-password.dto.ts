import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { trimString } from 'src/common/utils/transformString.util';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @Length(64, 64)
  @Matches(/^[a-f0-9]+$/, { message: 'token inválido' })
  @Transform(({ value }) => trimString(value))
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Transform(({ value }) => trimString(value))
  password: string;
}
