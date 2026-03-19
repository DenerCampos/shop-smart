import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseService } from 'src/common/response/response';
import { User } from 'src/user/entities/user.entity';
import { FamilyGroupService } from './family-group.service';
import { CreateFamilyGroupDto } from './dto/create-family-group.dto';
import { UpdateFamilyGroupDto } from './dto/update-family-group.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { FamilyGroupResponseDto } from './dto/family-group-response.dto';
import { FamilyGroupMemberResponseDto } from './dto/family-group-member-response.dto';
import { FamilyGroupSummaryFilterDto } from './dto/family-group-summary-filter.dto';
import { FamilyGroupSummaryResponseDto } from './dto/family-group-summary-response.dto';
import { FamilyGroupMemberDataResponseDto } from './dto/family-group-member-data-response.dto';

@Controller('/family-group')
@UseGuards(AuthGuard)
export class FamilyGroupController {
  constructor(
    private readonly familyGroupService: FamilyGroupService,
    private readonly responseService: ResponseService,
  ) {}

  // ========================
  // CRUD do Grupo
  // ========================

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateFamilyGroupDto,
  ): Promise<FamilyGroupResponseDto> {
    const group = await this.familyGroupService.create(user, dto.name);
    return this.responseService.mapToDto(FamilyGroupResponseDto, group);
  }

  @Get()
  async findAll(@CurrentUser() user: User): Promise<FamilyGroupResponseDto[]> {
    const groups = await this.familyGroupService.findGroupsByUser(user.id);
    return this.responseService.mapArrayToDto(FamilyGroupResponseDto, groups);
  }

  @Get('invitations')
  async getInvitations(
    @CurrentUser() user: User,
  ): Promise<FamilyGroupMemberResponseDto[]> {
    const invitations = await this.familyGroupService.getPendingInvitations(
      user,
    );
    return this.responseService.mapArrayToDto(
      FamilyGroupMemberResponseDto,
      invitations,
    );
  }

  @Patch('invitations/:id/accept')
  async acceptInvitation(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<FamilyGroupMemberResponseDto> {
    const member = await this.familyGroupService.acceptInvitation(id, user.id);
    return this.responseService.mapToDto(FamilyGroupMemberResponseDto, member);
  }

  @Patch('invitations/:id/reject')
  async rejectInvitation(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<FamilyGroupMemberResponseDto> {
    const member = await this.familyGroupService.rejectInvitation(id, user.id);
    return this.responseService.mapToDto(FamilyGroupMemberResponseDto, member);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<FamilyGroupResponseDto> {
    const group = await this.familyGroupService.findGroupById(id, user.id);
    return this.responseService.mapToDto(FamilyGroupResponseDto, group);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateFamilyGroupDto,
  ): Promise<FamilyGroupResponseDto> {
    const group = await this.familyGroupService.updateGroup(
      id,
      user.id,
      dto.name,
    );
    return this.responseService.mapToDto(FamilyGroupResponseDto, group);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ deleted: boolean }> {
    const deleted = await this.familyGroupService.deleteGroup(id, user.id);
    return { deleted };
  }

  // ========================
  // Membros e Convites
  // ========================

  @Post(':id/invite')
  async inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: InviteMemberDto,
  ): Promise<FamilyGroupMemberResponseDto> {
    const member = await this.familyGroupService.inviteMember(
      id,
      user.id,
      dto.email,
    );
    return this.responseService.mapToDto(FamilyGroupMemberResponseDto, member);
  }

  @Get(':id/members')
  async getMembers(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<FamilyGroupMemberResponseDto[]> {
    const members = await this.familyGroupService.getMembers(id, user.id);
    return this.responseService.mapArrayToDto(
      FamilyGroupMemberResponseDto,
      members,
    );
  }

  @Patch(':id/members/:memberId/role')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<FamilyGroupMemberResponseDto> {
    const member = await this.familyGroupService.updateMemberRole(
      id,
      memberId,
      user.id,
      dto.role,
    );
    return this.responseService.mapToDto(FamilyGroupMemberResponseDto, member);
  }

  @Delete(':id/members/:memberId')
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: User,
  ): Promise<{ deleted: boolean }> {
    const deleted = await this.familyGroupService.removeMember(
      id,
      memberId,
      user.id,
    );
    return { deleted };
  }

  @Delete(':id/leave')
  async leaveGroup(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ left: boolean }> {
    const left = await this.familyGroupService.leaveGroup(id, user.id);
    return { left };
  }

  // ========================
  // Dashboard de Dados
  // ========================

  @Get(':id/summary')
  async getGroupSummary(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query() filter: FamilyGroupSummaryFilterDto,
  ): Promise<FamilyGroupSummaryResponseDto> {
    const result = await this.familyGroupService.getGroupSummary(
      id,
      user.id,
      filter.month,
      filter.year,
    );
    return this.responseService.mapToDto(FamilyGroupSummaryResponseDto, result);
  }

  @Get(':id/members/:targetUserId/data')
  async getMemberData(
    @Param('id') id: string,
    @Param('targetUserId') targetUserId: string,
    @CurrentUser() user: User,
    @Query() filter: FamilyGroupSummaryFilterDto,
  ): Promise<FamilyGroupMemberDataResponseDto> {
    const result = await this.familyGroupService.getMemberData(
      id,
      targetUserId,
      user.id,
      filter.month,
      filter.year,
    );
    return this.responseService.mapToDto(
      FamilyGroupMemberDataResponseDto,
      result,
    );
  }
}
