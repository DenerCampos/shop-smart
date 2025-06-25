import { IsOptional } from 'class-validator';
import { CreateGroupDto } from './create-group.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {
  @IsOptional()
  name: string;
}
