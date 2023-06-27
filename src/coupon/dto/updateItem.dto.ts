import { CreateItemDto } from './createItem.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateItemDto extends PartialType(CreateItemDto) {}
