import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FamilyMemberResolverService } from '../family-member-resolver.service';
import { FamilyGroupMember } from '../../../family-group/entities/family-group-member.entity';
import { mockQueryBuilderChain } from '../../test/typeorm-repository.mock';

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

  it('resolve retorna apenas o userId quando não há grupo', async () => {
    const qb = mockQueryBuilderChain(null);
    memberRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.resolve('user-99');

    expect(result).toEqual({
      userIds: ['user-99'],
      isAdmin: false,
      groupId: null,
    });
  });
});
