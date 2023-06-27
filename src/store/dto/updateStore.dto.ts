import { CreateStoreDto } from './createStore.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {}
