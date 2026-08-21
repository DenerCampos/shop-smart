import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimString } from 'src/common/utils/transformString.util';

export class DeleteAccountDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }) => trimString(value))
  password: string;
}
