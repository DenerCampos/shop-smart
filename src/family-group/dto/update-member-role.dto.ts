import { IsIn, IsNotEmpty } from 'class-validator';
import { FamilyGroupRole } from '../types/family-group-role.type';

export class UpdateMemberRoleDto {
  @IsNotEmpty()
  @IsIn(['admin', 'member'])
  role: FamilyGroupRole;
}
