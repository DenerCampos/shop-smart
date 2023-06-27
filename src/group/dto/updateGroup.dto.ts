import { CreateGroupDto } from './createGroup.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}
