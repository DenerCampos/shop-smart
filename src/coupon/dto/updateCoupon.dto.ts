import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateCouponDto } from './createCoupan.dto';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UpdateItemDto } from './updateItem.dto';
import { itemType } from '../types/itemType';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  @IsOptional()
  number: string;

  @IsOptional()
  url: string;

  @ValidateNested()
  @IsArray()
  @Type(() => UpdateItemDto)
  items: itemType[];
}
