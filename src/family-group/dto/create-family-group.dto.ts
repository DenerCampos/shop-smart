import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { trimString } from 'src/common/utils/transformString.util';
import { FAMILY_GROUP_COAT_OF_ARMS_REGEX } from '../constants/family-group-image.constant';

export class CreateFamilyGroupDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => trimString(value))
  name: string;

  @IsOptional()
  @IsString()
  @Matches(FAMILY_GROUP_COAT_OF_ARMS_REGEX, {
    message: 'coatOfArms deve ser um brasão válido do app.',
  })
  coatOfArms?: string;
}
