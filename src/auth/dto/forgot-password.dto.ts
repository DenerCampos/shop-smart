import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { normalizeEmail } from 'src/common/utils/transformString.util';

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }) => normalizeEmail(value))
  email: string;
}
