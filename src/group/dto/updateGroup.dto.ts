import { IsOptional } from 'class-validator';
import { CreateGroupDto } from './createGroup.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
//   @IsOptional()
//   id: string | number;

  @IsOptional()
  name: string;
}
