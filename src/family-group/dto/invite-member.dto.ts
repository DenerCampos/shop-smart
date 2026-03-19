import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { trimString } from 'src/common/utils/transformString.util';

export class InviteMemberDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @Transform(({ value }) => trimString(value))
  email: string;
}
