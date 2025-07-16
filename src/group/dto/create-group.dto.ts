import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { capitalizeFirstLetter } from 'src/common/utils/transformString.util';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;
}
