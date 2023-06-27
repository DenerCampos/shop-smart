import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateGroupDto } from 'src/group/dto/createGroup.dto';
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

  @IsNotEmpty()
  @IsNumber()
  total: number;

  @IsDateString()
  @IsOptional()
  purchaseDate: Date;

  @ValidateNested()
  @Type(() => CreateGroupDto)
  group: groupType;
}
