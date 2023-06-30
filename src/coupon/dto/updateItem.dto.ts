import { IsOptional, ValidateNested } from 'class-validator';
import { CreateItemDto } from './createItem.dto';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { groupType } from 'src/group/types/groupType';
import { UpdateGroupDto } from 'src/group/dto/updateGroup.dto';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @IsOptional()
  id: string | number;

  @IsOptional()
  code: string;

  @IsOptional()
  name: string;

  @IsOptional()
  quantity: number;

  @IsOptional()
  unit: string;

  @IsOptional()
  value: number;

  @IsOptional()
  total: number;

  @ValidateNested()
  @Type(() => UpdateGroupDto)
  group: groupType;
}
