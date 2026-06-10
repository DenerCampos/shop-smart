import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateGroupDto } from 'src/group/dto/create-group.dto';
import { groupType } from 'src/group/types/groupType';

export class CreateItemDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  warrantyDuration?: number | null;

  @IsOptional()
  @IsIn(['days', 'months', 'years'])
  warrantyUnit?: 'days' | 'months' | 'years' | null;

  @ValidateNested()
  @Type(() => CreateGroupDto)
  group: groupType;
}
