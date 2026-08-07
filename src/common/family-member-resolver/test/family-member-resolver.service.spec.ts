import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FamilyMemberResolverService } from '../family-member-resolver.service';
import { FamilyGroupMember } from '../../../family-group/entities/family-group-member.entity';
import { FAMILY_GROUP_ROLES } from '../../../family-group/types/family-group-role.type';
import { mockQueryBuilderChain } from '../../test/typeorm-repository.mock';

function mockQb(extras: Record<string, jest.Mock> = {}) {
  const qb: Record<string, jest.Mock> = {
    innerJoinAndSelect: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    innerJoin: jest.fn(),
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    take: jest.fn(),
    getOne: jest.fn().mockResolvedValue(null),
    getMany: jest.fn().mockResolvedValue([]),
    getRawMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    ...extras,
  };
  for (const [k, v] of Object.entries(qb)) {
    if (
      !['getOne', 'getMany', 'getRawMany', 'getCount'].includes(k) &&
      typeof v.mockReturnValue === 'function'
    ) {
      v.mockReturnValue(qb);
    }
  }
  return qb;
}

describe('FamilyMemberResolverService', () => {
  let service: FamilyMemberResolverService;
  let memberRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    memberRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyMemberResolverService,
        {
          provide: getRepositoryToken(FamilyGroupMember),
          useValue: memberRepo,
        },
      ],
    }).compile();

    service = module.get(FamilyMemberResolverService);
  });

  it('resolve sem familyGroupId retorna apenas o userId', async () => {
    const result = await service.resolve('user-99');

    expect(result).toEqual({
      userIds: ['user-99'],
      isAdmin: false,
      groupId: null,
    });
    expect(memberRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('resolve com familyGroupId sem membership lança ForbiddenException', async () => {
    const qb = mockQueryBuilderChain(null);
    memberRepo.createQueryBuilder.mockReturnValue(qb);

    await expect(service.resolve('user-99', 'group-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('resolve com admin retorna userIds do grupo', async () => {
    const membership = {
      role: FAMILY_GROUP_ROLES.ADMIN,
      familyGroup: { id: 'group-1' },
    };
    const membershipQb = mockQb({
      getOne: jest.fn().mockResolvedValue(membership),
    });
    const membersQb = mockQb({
      getRawMany: jest
        .fn()
        .mockResolvedValue([{ userId: 'user-99' }, { userId: 'user-2' }]),
    });
    memberRepo.createQueryBuilder
      .mockReturnValueOnce(membershipQb)
      .mockReturnValueOnce(membersQb);

    const result = await service.resolve('user-99', 'group-1');

    expect(result).toEqual({
      userIds: ['user-99', 'user-2'],
      isAdmin: true,
      groupId: 'group-1',
    });
  });

  it('getAcceptedMemberUserIds sem membership lança ForbiddenException', async () => {
    memberRepo.createQueryBuilder.mockReturnValue(mockQueryBuilderChain(null));

    await expect(
      service.getAcceptedMemberUserIds('user-1', 'group-x'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getAcceptedMemberUserIdsIfAdmin membro não-admin retorna só o próprio id', async () => {
    const membershipQb = mockQb({
      getOne: jest.fn().mockResolvedValue({
        role: FAMILY_GROUP_ROLES.MEMBER,
        familyGroup: { id: 'group-1' },
      }),
    });
    memberRepo.createQueryBuilder.mockReturnValue(membershipQb);

    const result = await service.getAcceptedMemberUserIdsIfAdmin(
      'user-1',
      'group-1',
    );

    expect(result).toEqual(['user-1']);
  });

  it('isAdminOfAnyGroup retorna true quando count > 0', async () => {
    memberRepo.createQueryBuilder.mockReturnValue(
      mockQb({ getCount: jest.fn().mockResolvedValue(1) }),
    );

    await expect(service.isAdminOfAnyGroup('user-1')).resolves.toBe(true);
  });

  it('isAdminOfAnyGroup retorna false quando count = 0', async () => {
    memberRepo.createQueryBuilder.mockReturnValue(
      mockQb({ getCount: jest.fn().mockResolvedValue(0) }),
    );

    await expect(service.isAdminOfAnyGroup('user-1')).resolves.toBe(false);
  });

  it('getPrimaryFamilyGroupId retorna o grupo de maior prioridade', async () => {
    memberRepo.createQueryBuilder.mockReturnValue(
      mockQb({
        getRawMany: jest.fn().mockResolvedValue([
          {
            groupId: 'g-member',
            groupName: 'Beta',
            ownerId: 'other',
            role: 'member',
            joinedAt: new Date('2024-01-01'),
          },
          {
            groupId: 'g-owner',
            groupName: 'Alpha',
            ownerId: 'user-1',
            role: 'admin',
            joinedAt: new Date('2025-01-01'),
          },
        ]),
      }),
    );

    await expect(service.getPrimaryFamilyGroupId('user-1')).resolves.toBe(
      'g-owner',
    );
  });

  it('findAdminGroupForTarget retorna null quando não há grupo em comum admin', async () => {
    memberRepo.createQueryBuilder.mockReturnValue(
      mockQb({ getRawMany: jest.fn().mockResolvedValue([]) }),
    );

    await expect(
      service.findAdminGroupForTarget('admin-1', 'target-1'),
    ).resolves.toBeNull();
  });

  it('shareAnyAcceptedGroup retorna true quando count > 0', async () => {
    memberRepo.createQueryBuilder.mockReturnValue(
      mockQb({ getCount: jest.fn().mockResolvedValue(2) }),
    );

    await expect(
      service.shareAnyAcceptedGroup('a', 'b'),
    ).resolves.toBe(true);
  });

  it('shareAnyAcceptedGroup retorna true para o mesmo userId sem query', async () => {
    await expect(service.shareAnyAcceptedGroup('a', 'a')).resolves.toBe(true);
    expect(memberRepo.createQueryBuilder).not.toHaveBeenCalled();
  });
});
