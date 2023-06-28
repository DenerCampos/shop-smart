import { IsOptional } from 'class-validator';
import { CreateStoreDto } from './createStore.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {
//   @IsOptional()
//   id: string | number;

  @IsOptional()
  name: string;
}
