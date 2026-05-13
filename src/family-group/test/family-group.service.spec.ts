import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { DataSource } from 'typeorm';
import { FamilyGroupService } from '../family-group.service';
import { IFamilyGroupRepository } from '../interfaces/family-group.repository.interface';
import { UserService } from '../../user/user.service';
import { ExpenseService } from '../../expense/expense.service';
import { RevenueService } from '../../revenue/revenue.service';
import { EVENT_EMITTER } from '../../common/event-emitter/event-emitter.provider';
import { FAMILY_GROUP_ROLES } from '../types/family-group-role.type';
import { FAMILY_GROUP_MEMBER_STATUS } from '../types/family-group-member-status.type';
import { FamilyGroup } from '../entities/family-group.entity';
import { FamilyGroupMember } from '../entities/family-group-member.entity';
import { User } from '../../user/entities/user.entity';

const makeUser = (id: string): Partial<User> => ({
  id,
  name: id,
  email: `${id}@test.com`,
  profileImage: null,
});

const makeMember = (
  userId: string,
  role: string,
  status: string,
): Partial<FamilyGroupMember> => ({
  id: `member-${userId}`,
  role: role as FamilyGroupMember['role'],
  status: status as FamilyGroupMember['status'],
  user: makeUser(userId) as User,
  familyGroup: { id: 'group-1', name: 'Test Group' } as FamilyGroup,
});

const makeGroup = (
  members: Partial<FamilyGroupMember>[],
): Partial<FamilyGroup> => ({
  id: 'group-1',
  name: 'Test Group',
  owner: makeUser('admin-id') as User,
  members: members as FamilyGroupMember[],
});

describe('FamilyGroupService', () => {
  let service: FamilyGroupService;
  let familyGroupRepository: jest.Mocked<IFamilyGroupRepository>;
  let expenseService: jest.Mocked<Pick<ExpenseService, 'getByPeriod'>>;
  let revenueService: jest.Mocked<Pick<RevenueService, 'getByPeriod'>>;

  beforeEach(async () => {
    familyGroupRepository = {
      findGroupsByUserId: jest.fn().mockResolvedValue([]),
      findGroupById: jest.fn(),
      findMemberByGroupAndUser: jest.fn(),
      createGroup: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
      createMember: jest.fn(),
      findMemberById: jest.fn(),
      findMembersByGroupId: jest.fn(),
      findMemberByGroupAndEmail: jest.fn(),
      findPendingInvitationsByUserId: jest.fn(),
      findPendingInvitationsByEmail: jest.fn(),
      findAcceptedMembershipByUserId: jest.fn(),
      updateMemberRole: jest.fn(),
      updateMemberStatus: jest.fn(),
      linkUserToMember: jest.fn(),
      deleteMember: jest.fn(),
    };

    expenseService = { getByPeriod: jest.fn().mockResolvedValue([]) };
    revenueService = { getByPeriod: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyGroupService,
        { provide: 'IFamilyGroupRepository', useValue: familyGroupRepository },
        { provide: UserService, useValue: {} },
        { provide: ExpenseService, useValue: expenseService },
        { provide: RevenueService, useValue: revenueService },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
        { provide: EVENT_EMITTER, useValue: new EventEmitter() },
      ],
    }).compile();

    service = module.get(FamilyGroupService);
  });

  it('findGroupsByUser retorna lista vazia quando repositório não encontra grupos', async () => {
    const result = await service.findGroupsByUser('user-x');
    expect(result).toEqual([]);
    expect(familyGroupRepository.findGroupsByUserId).toHaveBeenCalledWith(
      'user-x',
    );
  });

  describe('getGroupSummary - privacidade de dados financeiros', () => {
    const adminMember = makeMember(
      'admin-id',
      FAMILY_GROUP_ROLES.ADMIN,
      FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
    );
    const memberA = makeMember(
      'member-a',
      FAMILY_GROUP_ROLES.MEMBER,
      FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
    );
    const memberB = makeMember(
      'member-b',
      FAMILY_GROUP_ROLES.MEMBER,
      FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
    );
    const group = makeGroup([adminMember, memberA, memberB]);

    beforeEach(() => {
      familyGroupRepository.findGroupById.mockResolvedValue(
        group as FamilyGroup,
      );
      expenseService.getByPeriod.mockResolvedValue([
        { id: 'e1', name: 'Mercado', value: 100, date: new Date() } as any,
      ]);
      revenueService.getByPeriod.mockResolvedValue([
        { id: 'r1', name: 'Salário', value: 200, date: new Date() } as any,
      ]);
    });

    it('admin recebe dados de todos os membros com masked: false', async () => {
      familyGroupRepository.findMemberByGroupAndUser.mockResolvedValue(
        adminMember as FamilyGroupMember,
      );

      const result = await service.getGroupSummary(
        'group-1',
        'admin-id',
        5,
        2026,
      );

      expect(result.members).toHaveLength(3);
      result.members.forEach((m) => expect(m.masked).toBe(false));
    });

    it('membro comum recebe seus próprios dados com masked: false', async () => {
      familyGroupRepository.findMemberByGroupAndUser.mockResolvedValue(
        memberA as FamilyGroupMember,
      );

      const result = await service.getGroupSummary(
        'group-1',
        'member-a',
        5,
        2026,
      );

      const own = result.members.find((m) => m.userId === 'member-a');
      expect(own?.masked).toBe(false);
    });

    it('membro comum recebe outros membros com masked: true e valores zerados', async () => {
      familyGroupRepository.findMemberByGroupAndUser.mockResolvedValue(
        memberA as FamilyGroupMember,
      );

      const result = await service.getGroupSummary(
        'group-1',
        'member-a',
        5,
        2026,
      );

      const others = result.members.filter((m) => m.userId !== 'member-a');
      expect(others.length).toBeGreaterThan(0);
      others.forEach((m) => {
        expect(m.masked).toBe(true);
        expect(m.totalExpenses).toBe(0);
        expect(m.totalRevenues).toBe(0);
      });
    });

    it('admin: totalExpenses aplica toFixed(2) na soma dos membros', async () => {
      familyGroupRepository.findMemberByGroupAndUser.mockResolvedValue(
        adminMember as FamilyGroupMember,
      );
      expenseService.getByPeriod.mockResolvedValue([
        { id: 'e1', name: 'Item', value: '33.333', date: new Date() } as any,
      ]);
      revenueService.getByPeriod.mockResolvedValue([]);

      const result = await service.getGroupSummary(
        'group-1',
        'admin-id',
        5,
        2026,
      );

      // getMemberFinancials arredonda por membro (33.333 → 33.33) antes de somar,
      // então o total é 33.33 * 3 = 99.99 (não 100.00)
      expect(Number.isFinite(result.totalExpenses)).toBe(true);
      expect(result.totalExpenses).toBe(99.99);
    });

    it('membro comum: totalExpenses reflete apenas seus próprios dados', async () => {
      familyGroupRepository.findMemberByGroupAndUser.mockResolvedValue(
        memberA as FamilyGroupMember,
      );
      expenseService.getByPeriod.mockImplementation((userId) => {
        if (userId === 'member-a')
          return Promise.resolve([
            { id: 'e1', name: 'Gasto', value: 50, date: new Date() } as any,
          ]);
        return Promise.resolve([]);
      });

      const result = await service.getGroupSummary(
        'group-1',
        'member-a',
        5,
        2026,
      );

      expect(result.totalExpenses).toBe(50);
    });
  });

  describe('getMemberData - privacidade de dados financeiros', () => {
    const adminMember = makeMember(
      'admin-id',
      FAMILY_GROUP_ROLES.ADMIN,
      FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
    );
    const memberA = makeMember(
      'member-a',
      FAMILY_GROUP_ROLES.MEMBER,
      FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
    );
    const memberB = makeMember(
      'member-b',
      FAMILY_GROUP_ROLES.MEMBER,
      FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
    );
    const group = makeGroup([adminMember, memberA, memberB]);

    beforeEach(() => {
      familyGroupRepository.findGroupById.mockResolvedValue(
        group as FamilyGroup,
      );
      expenseService.getByPeriod.mockResolvedValue([]);
      revenueService.getByPeriod.mockResolvedValue([]);
    });

    it('admin recebe dados completos de qualquer membro com masked: false', async () => {
      familyGroupRepository.findMemberByGroupAndUser
        .mockResolvedValueOnce(adminMember as FamilyGroupMember)
        .mockResolvedValueOnce(memberA as FamilyGroupMember);

      const result = await service.getMemberData(
        'group-1',
        'member-a',
        'admin-id',
        5,
        2026,
      );

      expect(result.masked).toBe(false);
      expect(Array.isArray(result.expenses)).toBe(true);
      expect(Array.isArray(result.revenues)).toBe(true);
    });

    it('membro comum recebe seus próprios dados com masked: false', async () => {
      familyGroupRepository.findMemberByGroupAndUser
        .mockResolvedValueOnce(memberA as FamilyGroupMember)
        .mockResolvedValueOnce(memberA as FamilyGroupMember);

      const result = await service.getMemberData(
        'group-1',
        'member-a',
        'member-a',
        5,
        2026,
      );

      expect(result.masked).toBe(false);
    });

    it('membro comum acessando outro membro recebe resposta mascarada (HTTP 200, não 403)', async () => {
      familyGroupRepository.findMemberByGroupAndUser
        .mockResolvedValueOnce(memberA as FamilyGroupMember)
        .mockResolvedValueOnce(memberB as FamilyGroupMember);

      const result = await service.getMemberData(
        'group-1',
        'member-b',
        'member-a',
        5,
        2026,
      );

      expect(result.masked).toBe(true);
      expect(result.totalExpenses).toBe(0);
      expect(result.totalRevenues).toBe(0);
      expect(result.expenses).toEqual([]);
      expect(result.revenues).toEqual([]);
    });

    it('resposta mascarada contém userId, name e profileImage do membro alvo', async () => {
      familyGroupRepository.findMemberByGroupAndUser
        .mockResolvedValueOnce(memberA as FamilyGroupMember)
        .mockResolvedValueOnce(memberB as FamilyGroupMember);

      const result = await service.getMemberData(
        'group-1',
        'member-b',
        'member-a',
        5,
        2026,
      );

      expect(result.userId).toBe('member-b');
      expect(result.name).toBe('member-b');
    });

    it('resposta mascarada não chama serviços de despesas nem receitas', async () => {
      familyGroupRepository.findMemberByGroupAndUser
        .mockResolvedValueOnce(memberA as FamilyGroupMember)
        .mockResolvedValueOnce(memberB as FamilyGroupMember);

      await service.getMemberData('group-1', 'member-b', 'member-a', 5, 2026);

      expect(expenseService.getByPeriod).not.toHaveBeenCalled();
      expect(revenueService.getByPeriod).not.toHaveBeenCalled();
    });
  });
});
