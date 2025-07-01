import { IsOptional } from 'class-validator';
import { CreateGroupDto } from './create-group.dto';
import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { capitalizeFirstLetter } from 'src/common/utils/transformString';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @IsOptional()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;
}
