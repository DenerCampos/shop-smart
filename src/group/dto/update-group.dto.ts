import { CreateGroupDto } from './create-group.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}
