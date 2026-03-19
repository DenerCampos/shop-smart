import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { trimString } from 'src/common/utils/transformString.util';

export class CreateFamilyGroupDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => trimString(value))
  name: string;
}
