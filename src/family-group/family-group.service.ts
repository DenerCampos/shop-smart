import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EventEmitter } from 'events';
import { EVENT_EMITTER } from 'src/common/event-emitter/event-emitter.provider';
import { IFamilyGroupRepository } from './interfaces/family-group.repository.interface';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { FamilyGroup } from './entities/family-group.entity';
import { FamilyGroupMember } from './entities/family-group-member.entity';
import {
  FAMILY_GROUP_ROLES,
  FamilyGroupRole,
} from './types/family-group-role.type';
import { FAMILY_GROUP_MEMBER_STATUS } from './types/family-group-member-status.type';
import { NotExistException } from 'src/exception/notExistException';
import { ExpenseService } from 'src/expense/expense.service';
import { RevenueService } from 'src/revenue/revenue.service';
import { UserCreatedEvent } from 'src/user/events/user-created.event';
import { FamilyGroupSummaryResponseDto } from './dto/family-group-summary-response.dto';
import { FamilyGroupMemberDataResponseDto } from './dto/family-group-member-data-response.dto';

@Injectable()
export class FamilyGroupService {
  private readonly logger = new Logger(FamilyGroupService.name);

  constructor(
    @Inject('IFamilyGroupRepository')
    private readonly familyGroupRepository: IFamilyGroupRepository,
    private readonly userService: UserService,
    private readonly expenseService: ExpenseService,
    private readonly revenueService: RevenueService,
    private readonly dataSource: DataSource,
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
  ) {
    this.eventEmitter.on('user.created', this.handleUserCreated.bind(this));
  }

  // ========================
  // CRUD do Grupo
  // ========================

  async create(user: User, name: string): Promise<FamilyGroup> {
    const existingMembership =
      await this.familyGroupRepository.findAcceptedMembershipByUserId(user.id);

    if (existingMembership) {
      throw new ConflictException(
        'Você já participa de um grupo familiar. Saia do grupo atual antes de criar um novo.',
      );
    }

    const group = await this.dataSource.transaction(async (manager) => {
      const groupRepo = manager.getRepository(FamilyGroup);
      const memberRepo = manager.getRepository(FamilyGroupMember);

      const newGroup = groupRepo.create({ name, owner: user });
      const savedGroup = await groupRepo.save(newGroup);

      const member = memberRepo.create({
        familyGroup: savedGroup,
        user,
        invitedEmail: user.email,
        role: FAMILY_GROUP_ROLES.ADMIN,
        status: FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
        invitedBy: user,
        joinedAt: new Date(),
      });
      await memberRepo.save(member);

      await manager.getRepository(User).update(user.id, { family: name });

      return savedGroup;
    });

    return await this.familyGroupRepository.findGroupById(group.id);
  }

  async findGroupsByUser(userId: string): Promise<FamilyGroup[]> {
    const groups = await this.familyGroupRepository.findGroupsByUserId(userId);

    return groups.map((group) => this.filterMembersByRole(group, userId));
  }

  async findGroupById(groupId: string, userId: string): Promise<FamilyGroup> {
    const group = await this.familyGroupRepository.findGroupById(groupId);

    if (!group) {
      throw new NotExistException();
    }

    await this.validateMembership(groupId, userId);

    return this.filterMembersByRole(group, userId);
  }

  async updateGroup(
    groupId: string,
    userId: string,
    name: string,
  ): Promise<FamilyGroup> {
    const group = await this.familyGroupRepository.findGroupById(groupId);

    if (!group) {
      throw new NotExistException();
    }

    await this.validateAdmin(groupId, userId);

    return await this.familyGroupRepository.updateGroup(group, name);
  }

  async deleteGroup(groupId: string, userId: string): Promise<boolean> {
    const group = await this.familyGroupRepository.findGroupById(groupId);

    if (!group) {
      throw new NotExistException();
    }

    if (group.owner.id !== userId) {
      throw new ForbiddenException('Apenas o criador do grupo pode deletá-lo.');
    }

    return await this.familyGroupRepository.deleteGroup(groupId);
  }

  // ========================
  // Sistema de Convites
  // ========================

  async inviteMember(
    groupId: string,
    userId: string,
    email: string,
  ): Promise<FamilyGroupMember> {
    const group = await this.familyGroupRepository.findGroupById(groupId);

    if (!group) {
      throw new NotExistException();
    }

    await this.validateAdmin(groupId, userId);

    const inviter = await this.userService.find(userId);

    if (inviter.email === email) {
      throw new ConflictException('Você não pode convidar a si mesmo.');
    }

    const existingMember =
      await this.familyGroupRepository.findMemberByGroupAndEmail(
        groupId,
        email,
      );

    if (existingMember && existingMember.status !== 'rejected') {
      throw new ConflictException(
        'Este email já possui um convite pendente ou já é membro do grupo.',
      );
    }

    const invitedUser = await this.userService.findByEmail(email);

    if (invitedUser) {
      const existingAccepted =
        await this.familyGroupRepository.findAcceptedMembershipByUserId(
          invitedUser.id,
        );

      if (existingAccepted) {
        throw new ConflictException(
          'Este usuário já participa de outro grupo familiar.',
        );
      }
    }

    // TODO: Enviar email de convite (mockado por enquanto)
    this.logger.log(
      `[MOCK EMAIL] Convite enviado para ${email} para o grupo "${group.name}"`,
    );

    return await this.familyGroupRepository.createMember(
      group,
      invitedUser || null,
      email,
      FAMILY_GROUP_ROLES.MEMBER,
      FAMILY_GROUP_MEMBER_STATUS.PENDING,
      inviter,
    );
  }

  async getPendingInvitations(user: User): Promise<FamilyGroupMember[]> {
    const byUserId =
      await this.familyGroupRepository.findPendingInvitationsByUserId(user.id);
    const byEmail =
      await this.familyGroupRepository.findPendingInvitationsByEmail(
        user.email,
      );

    const allInvitations = [...byUserId];
    for (const inv of byEmail) {
      if (!allInvitations.some((existing) => existing.id === inv.id)) {
        allInvitations.push(inv);
      }
    }

    return allInvitations;
  }

  async acceptInvitation(
    invitationId: string,
    userId: string,
  ): Promise<FamilyGroupMember> {
    const member =
      await this.familyGroupRepository.findMemberById(invitationId);

    if (!member) {
      throw new NotExistException();
    }

    if (member.status !== 'pending') {
      throw new ConflictException('Este convite já foi respondido.');
    }

    if (member.user && member.user.id !== userId) {
      throw new ForbiddenException('Este convite não pertence a você.');
    }

    if (!member.user) {
      const user = await this.userService.find(userId);
      if (user.email.toLowerCase() !== member.invitedEmail.toLowerCase()) {
        throw new ForbiddenException(
          'Este convite foi enviado para outro email.',
        );
      }
    }

    const existingAccepted =
      await this.familyGroupRepository.findAcceptedMembershipByUserId(userId);

    if (existingAccepted) {
      throw new ConflictException(
        'Você já participa de um grupo familiar. Saia do grupo atual para aceitar este convite.',
      );
    }

    if (!member.user) {
      const user = await this.userService.find(userId);
      await this.familyGroupRepository.linkUserToMember(member, user);
    }

    return await this.familyGroupRepository.updateMemberStatus(
      member,
      FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      new Date(),
    );
  }

  async rejectInvitation(
    invitationId: string,
    userId: string,
  ): Promise<FamilyGroupMember> {
    const member =
      await this.familyGroupRepository.findMemberById(invitationId);

    if (!member) {
      throw new NotExistException();
    }

    if (member.status !== 'pending') {
      throw new ConflictException('Este convite já foi respondido.');
    }

    if (member.user && member.user.id !== userId) {
      throw new ForbiddenException('Este convite não pertence a você.');
    }

    if (!member.user) {
      const user = await this.userService.find(userId);
      if (user.email.toLowerCase() !== member.invitedEmail.toLowerCase()) {
        throw new ForbiddenException(
          'Este convite foi enviado para outro email.',
        );
      }
    }

    return await this.familyGroupRepository.updateMemberStatus(
      member,
      FAMILY_GROUP_MEMBER_STATUS.REJECTED,
    );
  }

  // ========================
  // Gerenciamento de Membros
  // ========================

  async getMembers(
    groupId: string,
    userId: string,
  ): Promise<FamilyGroupMember[]> {
    const currentMember = await this.validateMembership(groupId, userId);

    const members =
      await this.familyGroupRepository.findMembersByGroupId(groupId);

    if (currentMember.role === FAMILY_GROUP_ROLES.ADMIN) {
      return members;
    }

    return members.filter((m) => m.role !== FAMILY_GROUP_ROLES.ADMIN);
  }

  async updateMemberRole(
    groupId: string,
    memberId: string,
    userId: string,
    role: FamilyGroupRole,
  ): Promise<FamilyGroupMember> {
    await this.validateAdmin(groupId, userId);

    const member = await this.familyGroupRepository.findMemberById(memberId);

    if (!member) {
      throw new NotExistException();
    }

    if (member.familyGroup.id !== groupId) {
      throw new ForbiddenException('Este membro não pertence a este grupo.');
    }

    return await this.familyGroupRepository.updateMemberRole(member, role);
  }

  async removeMember(
    groupId: string,
    memberId: string,
    userId: string,
  ): Promise<boolean> {
    const group = await this.familyGroupRepository.findGroupById(groupId);

    if (!group) {
      throw new NotExistException();
    }

    await this.validateAdmin(groupId, userId);

    const member = await this.familyGroupRepository.findMemberById(memberId);

    if (!member) {
      throw new NotExistException();
    }

    if (member.familyGroup.id !== groupId) {
      throw new ForbiddenException('Este membro não pertence a este grupo.');
    }

    if (member.user && member.user.id === group.owner.id) {
      throw new ForbiddenException('O criador do grupo não pode ser removido.');
    }

    return await this.familyGroupRepository.deleteMember(memberId);
  }

  async leaveGroup(groupId: string, userId: string): Promise<boolean> {
    const group = await this.familyGroupRepository.findGroupById(groupId);

    if (!group) {
      throw new NotExistException();
    }

    if (group.owner.id === userId) {
      throw new ForbiddenException(
        'O criador do grupo não pode sair. Delete o grupo ou transfira a propriedade.',
      );
    }

    const member = await this.familyGroupRepository.findMemberByGroupAndUser(
      groupId,
      userId,
    );

    if (!member) {
      throw new NotExistException();
    }

    return await this.familyGroupRepository.deleteMember(member.id);
  }

  // ========================
  // Dashboard de Dados
  // ========================

  async getGroupSummary(
    groupId: string,
    userId: string,
    month: number,
    year: number,
  ): Promise<FamilyGroupSummaryResponseDto> {
    const group = await this.familyGroupRepository.findGroupById(groupId);

    if (!group) {
      throw new NotExistException();
    }

    const currentMember =
      await this.familyGroupRepository.findMemberByGroupAndUser(
        groupId,
        userId,
      );

    if (!currentMember) {
      throw new ForbiddenException('Você não pertence a este grupo.');
    }

    const isAdmin = currentMember.role === FAMILY_GROUP_ROLES.ADMIN;

    const visibleMembers = group.members.filter(
      (m) => m.status === FAMILY_GROUP_MEMBER_STATUS.ACCEPTED && m.user,
    );

    const { startDate, endDate } = this.buildDateRange(month, year);

    const membersSummary = await Promise.all(
      visibleMembers.map(async (member) => {
        const isCurrentUser = member.user.id === userId;

        if (!isAdmin && !isCurrentUser) {
          return this.buildMaskedMemberResponse(member.user);
        }

        const { totalExpenses, totalRevenues } = await this.getMemberFinancials(
          member.user,
          startDate,
          endDate,
        );

        return {
          userId: member.user.id,
          name: member.user.name,
          profileImage: member.user.profileImage ?? null,
          totalExpenses,
          totalRevenues,
          masked: false,
        };
      }),
    );

    const ownSummary = membersSummary.find((m) => m.userId === userId);
    const ownExpenses = ownSummary?.totalExpenses ?? 0;
    const ownRevenues = ownSummary?.totalRevenues ?? 0;

    const totalExpenses = isAdmin
      ? Number(
          membersSummary
            .filter((m) => !m.masked)
            .reduce((sum, m) => sum + m.totalExpenses, 0)
            .toFixed(2),
        )
      : ownExpenses;

    const totalRevenues = isAdmin
      ? Number(
          membersSummary
            .filter((m) => !m.masked)
            .reduce((sum, m) => sum + m.totalRevenues, 0)
            .toFixed(2),
        )
      : ownRevenues;

    return {
      groupId: group.id,
      groupName: group.name,
      totalExpenses,
      totalRevenues,
      balance: totalRevenues - totalExpenses,
      members: membersSummary,
    };
  }

  /**
   * Retorna os dados financeiros de um membro do grupo.
   *
   * @note Mudança de contrato: antes lançava ForbiddenException (403) quando um
   * não-admin tentava acessar dados de outro membro. Agora retorna HTTP 200 com
   * `masked: true` e valores zerados, permitindo que o cliente renderize o
   * estado "dados ocultos" sem precisar tratar o erro.
   */
  async getMemberData(
    groupId: string,
    targetUserId: string,
    userId: string,
    month: number,
    year: number,
  ): Promise<FamilyGroupMemberDataResponseDto> {
    const group = await this.familyGroupRepository.findGroupById(groupId);

    if (!group) {
      throw new NotExistException();
    }

    const currentMember =
      await this.familyGroupRepository.findMemberByGroupAndUser(
        groupId,
        userId,
      );

    if (!currentMember) {
      throw new ForbiddenException('Você não pertence a este grupo.');
    }

    const targetMember =
      await this.familyGroupRepository.findMemberByGroupAndUser(
        groupId,
        targetUserId,
      );

    if (!targetMember) {
      throw new NotExistException();
    }

    const isAdmin = currentMember.role === FAMILY_GROUP_ROLES.ADMIN;
    const isCurrentUser = targetUserId === userId;

    if (!isAdmin && !isCurrentUser) {
      return {
        ...this.buildMaskedMemberResponse(targetMember.user),
        expenses: [],
        revenues: [],
      };
    }

    const { startDate, endDate } = this.buildDateRange(month, year);

    const [expenses, revenues] = await Promise.all([
      this.expenseService.getByPeriod(targetMember.user.id, startDate, endDate),
      this.revenueService.getByPeriod(targetMember.user.id, startDate, endDate),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.value), 0);
    const totalRevenues = revenues.reduce((sum, r) => sum + Number(r.value), 0);

    const expensesData = expenses.map((e) => ({
      id: e.id,
      name: e.name,
      value: Number(e.value),
      date: e.date,
    }));
    const revenuesData = revenues.map((r) => ({
      id: r.id,
      name: r.name,
      value: Number(r.value),
      date: r.date,
    }));

    return {
      userId: targetMember.user.id,
      name: targetMember.user.name,
      profileImage: targetMember.user.profileImage ?? null,
      totalExpenses: Number(totalExpenses.toFixed(2)),
      totalRevenues: Number(totalRevenues.toFixed(2)),
      masked: false,
      expenses: expensesData,
      revenues: revenuesData,
    };
  }

  // ========================
  // Evento user.created
  // ========================

  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    try {
      const pendingInvitations =
        await this.familyGroupRepository.findPendingInvitationsByEmail(
          event.user.email,
        );

      for (const invitation of pendingInvitations) {
        if (!invitation.user) {
          await this.familyGroupRepository.linkUserToMember(
            invitation,
            event.user,
          );
          this.logger.log(
            `Convite vinculado ao novo usuário ${event.user.email} para o grupo ${invitation.familyGroup.name}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Erro ao vincular convites para ${event.user.email}`,
        error.message,
      );
    }
  }

  // ========================
  // Métodos públicos auxiliares
  // ========================

  async isAcceptedAdmin(
    familyGroupId: string,
    userId: string,
  ): Promise<boolean> {
    const member =
      await this.familyGroupRepository.findMemberByGroupAndUser(
        familyGroupId,
        userId,
      );

    return (
      !!member &&
      member.status === FAMILY_GROUP_MEMBER_STATUS.ACCEPTED &&
      member.role === FAMILY_GROUP_ROLES.ADMIN
    );
  }

  async assertAcceptedMembership(
    groupId: string,
    userId: string,
  ): Promise<FamilyGroupMember> {
    return await this.validateMembership(groupId, userId);
  }

  async assertFamilyAdmin(
    groupId: string,
    userId: string,
  ): Promise<FamilyGroupMember> {
    return await this.validateAdmin(groupId, userId);
  }

  async getAcceptedMemberUserIds(userId: string): Promise<string[]> {
    const membership =
      await this.familyGroupRepository.findAcceptedMembershipByUserId(userId);

    if (!membership) {
      return [userId];
    }

    return this.extractAcceptedUserIds(membership.familyGroup.id, userId);
  }

  async getAcceptedMemberUserIdsIfAdmin(userId: string): Promise<string[]> {
    const membership =
      await this.familyGroupRepository.findAcceptedMembershipByUserId(userId);

    if (!membership || membership.role !== FAMILY_GROUP_ROLES.ADMIN) {
      return [userId];
    }

    return this.extractAcceptedUserIds(membership.familyGroup.id, userId);
  }

  private async extractAcceptedUserIds(
    groupId: string,
    fallbackUserId: string,
  ): Promise<string[]> {
    const members =
      await this.familyGroupRepository.findMembersByGroupId(groupId);

    const acceptedUserIds = members
      .filter((m) => m.status === FAMILY_GROUP_MEMBER_STATUS.ACCEPTED && m.user)
      .map((m) => m.user.id);

    return acceptedUserIds.length > 0 ? acceptedUserIds : [fallbackUserId];
  }

  // ========================
  // Helpers
  // ========================

  private async validateMembership(
    groupId: string,
    userId: string,
  ): Promise<FamilyGroupMember> {
    const member = await this.familyGroupRepository.findMemberByGroupAndUser(
      groupId,
      userId,
    );

    if (!member || member.status !== 'accepted') {
      throw new ForbiddenException('Você não pertence a este grupo.');
    }

    return member;
  }

  private async validateAdmin(
    groupId: string,
    userId: string,
  ): Promise<FamilyGroupMember> {
    const member = await this.validateMembership(groupId, userId);

    if (member.role !== FAMILY_GROUP_ROLES.ADMIN) {
      throw new ForbiddenException(
        'Apenas administradores podem realizar esta ação.',
      );
    }

    return member;
  }

  private filterMembersByRole(group: FamilyGroup, userId: string): FamilyGroup {
    const currentMember = group.members?.find((m) => m.user?.id === userId);

    if (!currentMember || currentMember.role === FAMILY_GROUP_ROLES.ADMIN) {
      return group;
    }

    return {
      ...group,
      members: group.members.filter(
        (m) =>
          m.role !== FAMILY_GROUP_ROLES.ADMIN &&
          m.status === FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      ),
    } as FamilyGroup;
  }

  private buildDateRange(
    month: number,
    year: number,
  ): { startDate: string; endDate: string } {
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(
      lastDay,
    ).padStart(2, '0')} 23:59:59`;
    return { startDate, endDate };
  }

  private buildMaskedMemberResponse(user: User) {
    return {
      userId: user.id,
      name: user.name,
      profileImage: user.profileImage ?? null,
      totalExpenses: 0,
      totalRevenues: 0,
      masked: true,
    };
  }

  private async getMemberFinancials(
    user: User,
    startDate: string,
    endDate: string,
  ): Promise<{ totalExpenses: number; totalRevenues: number }> {
    const [expenses, revenues] = await Promise.all([
      this.expenseService.getByPeriod(user.id, startDate, endDate),
      this.revenueService.getByPeriod(user.id, startDate, endDate),
    ]);

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.value), 0);
    const totalRevenues = revenues.reduce((sum, r) => sum + Number(r.value), 0);

    return {
      totalExpenses: Number(totalExpenses.toFixed(2)),
      totalRevenues: Number(totalRevenues.toFixed(2)),
    };
  }
}
