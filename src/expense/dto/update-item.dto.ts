import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { UpdateGroupDto } from 'src/group/dto/update-group.dto';
import { groupType } from 'src/group/types/groupType';
import { CreateItemDto } from './create-item.dto';
import { capitalizeFirstLetter } from 'src/common/utils/transformString.util';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @IsOptional()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  total: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  warrantyDuration?: number | null;

  @IsOptional()
  @IsIn(['days', 'months', 'years'])
  warrantyUnit?: 'days' | 'months' | 'years' | null;

  @IsOptional()
  @Type(() => UpdateGroupDto)
  group: groupType;
}
