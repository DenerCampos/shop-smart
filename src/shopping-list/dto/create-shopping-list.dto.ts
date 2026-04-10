import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { capitalizeFirstLetter } from 'src/common/utils/transformString.util';

export class CreateShoppingListDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;

  @IsOptional()
  @IsUUID()
  familyGroupId?: string;
}
