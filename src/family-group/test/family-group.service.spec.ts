import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { DataSource } from 'typeorm';
import { FamilyGroupService } from '../family-group.service';
import { IFamilyGroupRepository } from '../interfaces/family-group.repository.interface';
import { UserService } from '../../user/user.service';
import { ExpenseService } from '../../expense/expense.service';
import { RevenueService } from '../../revenue/revenue.service';
import { EVENT_EMITTER } from '../../common/event-emitter/event-emitter.provider';
import { FILE_STORAGE } from '../../file-storage/file-storage.constants';
import { IFileStorageService } from '../../file-storage/interfaces/file-storage.interface';
import {
  FAMILY_GROUP_MEMBER_INVITED_EVENT,
  FamilyGroupMemberInvitedEvent,
} from '../events/family-group-member-invited.event';
import { FAMILY_GROUP_ROLES } from '../types/family-group-role.type';
import { FAMILY_GROUP_MEMBER_STATUS } from '../types/family-group-member-status.type';
import { FamilyGroup } from '../entities/family-group.entity';
import { FamilyGroupMember } from '../entities/family-group-member.entity';
import { User } from '../../user/entities/user.entity';
import { UserCreatedEvent } from '../../user/events/user-created.event';

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
  let userService: jest.Mocked<Pick<UserService, 'find' | 'findByEmail'>>;
  let fileStorage: jest.Mocked<IFileStorageService>;
  let eventEmitter: EventEmitter;

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
    userService = {
      find: jest.fn(),
      findByEmail: jest.fn(),
    };
    fileStorage = {
      uploadFile: jest.fn().mockResolvedValue({
        fileId: 'file-1',
        fileName: 'family_group.png',
        webViewLink: 'https://storage/view/file-1',
        webContentLink: 'https://storage/content/file-1',
      }),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      extractFileIdFromUrl: jest.fn().mockReturnValue('old-file-id'),
    };
    eventEmitter = new EventEmitter();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyGroupService,
        { provide: 'IFamilyGroupRepository', useValue: familyGroupRepository },
        { provide: UserService, useValue: userService },
        { provide: ExpenseService, useValue: expenseService },
        { provide: RevenueService, useValue: revenueService },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
        { provide: FILE_STORAGE, useValue: fileStorage },
        { provide: EVENT_EMITTER, useValue: eventEmitter },
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

  describe('inviteMember - notificação', () => {
    const admin = {
      ...makeUser('admin-id'),
      name: 'Admin Nome',
      email: 'admin@test.com',
    } as User;
    const invited = {
      ...makeUser('invited-id'),
      name: 'Convidado',
      email: 'invited@test.com',
    } as User;
    const group = makeGroup([
      makeMember(
        'admin-id',
        FAMILY_GROUP_ROLES.ADMIN,
        FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
      ),
    ]) as FamilyGroup;

    beforeEach(() => {
      familyGroupRepository.findGroupById.mockResolvedValue(group);
      familyGroupRepository.findMemberByGroupAndUser.mockImplementation(
        async (_groupId: string, uid: string) => {
          if (uid === 'admin-id') {
            return makeMember(
              'admin-id',
              FAMILY_GROUP_ROLES.ADMIN,
              FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
            ) as FamilyGroupMember;
          }
          return null;
        },
      );
      familyGroupRepository.findMemberByGroupAndEmail.mockResolvedValue(null);
      userService.find.mockResolvedValue(admin);
    });

    it('emite family_group.member_invited quando convidado já tem conta', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');
      userService.findByEmail.mockResolvedValue(invited);
      familyGroupRepository.createMember.mockResolvedValue({
        id: 'member-new',
        createdAt: new Date('2026-08-07T12:00:00.000Z'),
      } as FamilyGroupMember);

      await service.inviteMember('group-1', 'admin-id', invited.email);

      expect(emitSpy).toHaveBeenCalledWith(
        FAMILY_GROUP_MEMBER_INVITED_EVENT,
        expect.any(FamilyGroupMemberInvitedEvent),
      );
      const event = emitSpy.mock.calls.find(
        (call) => call[0] === FAMILY_GROUP_MEMBER_INVITED_EVENT,
      )?.[1] as FamilyGroupMemberInvitedEvent;
      expect(event.recipientUserId).toBe('invited-id');
      expect(event.recipientEmail).toBe(invited.email);
      expect(event.recipientName).toBe('Convidado');
      expect(event.actorName).toBe('Admin Nome');
      expect(event.groupName).toBe('Test Group');
      expect(event.origin).toBe('invite');
    });

    it('emite evento sem userId quando convidado ainda não tem conta', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');
      userService.findByEmail.mockResolvedValue(null);
      familyGroupRepository.createMember.mockResolvedValue({
        id: 'member-new',
        createdAt: new Date(),
      } as FamilyGroupMember);

      await service.inviteMember('group-1', 'admin-id', 'new@test.com');

      const event = emitSpy.mock.calls.find(
        (call) => call[0] === FAMILY_GROUP_MEMBER_INVITED_EVENT,
      )?.[1] as FamilyGroupMemberInvitedEvent;

      expect(event).toBeInstanceOf(FamilyGroupMemberInvitedEvent);
      expect(event.recipientUserId).toBeNull();
      expect(event.recipientEmail).toBe('new@test.com');
      expect(event.recipientName).toBeNull();
    });
  });

  describe('updateGroup - nome e brasão', () => {
    const adminMember = makeMember(
      'admin-id',
      FAMILY_GROUP_ROLES.ADMIN,
      FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
    ) as FamilyGroupMember;

    beforeEach(() => {
      familyGroupRepository.findMemberByGroupAndUser.mockResolvedValue(
        adminMember,
      );
      familyGroupRepository.updateGroup.mockImplementation(
        async (group, data) => ({ ...group, ...data }) as FamilyGroup,
      );
    });

    it('atualiza apenas o nome quando brasão não é informado', async () => {
      familyGroupRepository.findGroupById.mockResolvedValue({
        ...makeGroup([adminMember]),
        groupImage: 'https://storage/content/foto',
      } as FamilyGroup);

      await service.updateGroup('group-1', 'admin-id', 'Novo Nome');

      expect(familyGroupRepository.updateGroup).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'group-1' }),
        { name: 'Novo Nome' },
      );
      expect(fileStorage.deleteFile).not.toHaveBeenCalled();
    });

    it('escolher brasão descarta a foto atual do grupo', async () => {
      familyGroupRepository.findGroupById.mockResolvedValue({
        ...makeGroup([adminMember]),
        groupImage: 'https://storage/content/foto',
      } as FamilyGroup);

      await service.updateGroup(
        'group-1',
        'admin-id',
        'Test Group',
        '/assets/images/brasao/brasao-3.png',
      );

      expect(familyGroupRepository.updateGroup).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'group-1' }),
        {
          name: 'Test Group',
          coatOfArms: '/assets/images/brasao/brasao-3.png',
          groupImage: null,
        },
      );
      expect(fileStorage.deleteFile).toHaveBeenCalledWith('old-file-id');
    });

    it('membro comum não pode alterar o grupo', async () => {
      familyGroupRepository.findGroupById.mockResolvedValue(
        makeGroup([adminMember]) as FamilyGroup,
      );
      familyGroupRepository.findMemberByGroupAndUser.mockResolvedValue(
        makeMember(
          'member-a',
          FAMILY_GROUP_ROLES.MEMBER,
          FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
        ) as FamilyGroupMember,
      );

      await expect(
        service.updateGroup('group-1', 'member-a', 'Novo Nome'),
      ).rejects.toThrow(ForbiddenException);
      expect(familyGroupRepository.updateGroup).not.toHaveBeenCalled();
    });
  });

  describe('uploadGroupImage', () => {
    const adminMember = makeMember(
      'admin-id',
      FAMILY_GROUP_ROLES.ADMIN,
      FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
    ) as FamilyGroupMember;

    const file = {
      buffer: Buffer.from('img'),
      mimetype: 'image/png',
      originalname: 'brasao.png',
    } as Express.Multer.File;

    beforeEach(() => {
      familyGroupRepository.findMemberByGroupAndUser.mockResolvedValue(
        adminMember,
      );
      familyGroupRepository.updateGroup.mockImplementation(
        async (group, data) => ({ ...group, ...data }) as FamilyGroup,
      );
    });

    it('salva a URL retornada pelo storage em groupImage', async () => {
      familyGroupRepository.findGroupById.mockResolvedValue(
        makeGroup([adminMember]) as FamilyGroup,
      );

      const result = await service.uploadGroupImage(
        'group-1',
        'admin-id',
        file,
      );

      expect(fileStorage.uploadFile).toHaveBeenCalledWith(
        file.buffer,
        expect.stringMatching(/^family_group_group-1_.+\.png$/),
        'image/png',
        'family-group',
      );
      expect(result.groupImage).toBe('https://storage/content/file-1');
    });

    it('remove a imagem anterior antes de enviar a nova', async () => {
      familyGroupRepository.findGroupById.mockResolvedValue({
        ...makeGroup([adminMember]),
        groupImage: 'https://storage/content/antiga',
      } as FamilyGroup);

      await service.uploadGroupImage('group-1', 'admin-id', file);

      expect(fileStorage.deleteFile).toHaveBeenCalledWith('old-file-id');
    });

    it('membro comum não pode enviar imagem do grupo', async () => {
      familyGroupRepository.findGroupById.mockResolvedValue(
        makeGroup([adminMember]) as FamilyGroup,
      );
      familyGroupRepository.findMemberByGroupAndUser.mockResolvedValue(
        makeMember(
          'member-a',
          FAMILY_GROUP_ROLES.MEMBER,
          FAMILY_GROUP_MEMBER_STATUS.ACCEPTED,
        ) as FamilyGroupMember,
      );

      await expect(
        service.uploadGroupImage('group-1', 'member-a', file),
      ).rejects.toThrow(ForbiddenException);
      expect(fileStorage.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('handleUserCreated - notificação', () => {
    it('emite family_group.member_invited após vincular convite pendente', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');
      const newUser = {
        ...makeUser('new-user'),
        name: 'Novo User',
        email: 'new@test.com',
      } as User;
      const invitation = {
        id: 'invite-1',
        user: null,
        createdAt: new Date('2026-08-01T10:00:00.000Z'),
        invitedBy: { name: 'Admin Nome' } as User,
        familyGroup: { id: 'group-1', name: 'Test Group' } as FamilyGroup,
      } as FamilyGroupMember;

      familyGroupRepository.findPendingInvitationsByEmail.mockResolvedValue([
        invitation,
      ]);
      familyGroupRepository.linkUserToMember.mockResolvedValue({
        ...invitation,
        user: newUser,
      });

      eventEmitter.emit('user.created', new UserCreatedEvent(newUser));
      await new Promise((resolve) => setImmediate(resolve));

      expect(familyGroupRepository.linkUserToMember).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith(
        FAMILY_GROUP_MEMBER_INVITED_EVENT,
        expect.any(FamilyGroupMemberInvitedEvent),
      );
    });
  });
});
