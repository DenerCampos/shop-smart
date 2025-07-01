import { IsOptional } from 'class-validator';
import { CreateStoreDto } from './create-store.dto';
import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { capitalizeFirstLetter } from 'src/common/utils/transformString';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
  @IsOptional()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;
}
