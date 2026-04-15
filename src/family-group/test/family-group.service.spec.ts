import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { DataSource } from 'typeorm';
import { FamilyGroupService } from '../family-group.service';
import { IFamilyGroupRepository } from '../interfaces/family-group.repository.interface';
import { UserService } from '../../user/user.service';
import { ExpenseService } from '../../expense/expense.service';
import { RevenueService } from '../../revenue/revenue.service';
import { EVENT_EMITTER } from '../../common/event-emitter/event-emitter.provider';

describe('FamilyGroupService', () => {
  let service: FamilyGroupService;
  let familyGroupRepository: jest.Mocked<
    Pick<IFamilyGroupRepository, 'findGroupsByUserId'>
  >;

  beforeEach(async () => {
    familyGroupRepository = {
      findGroupsByUserId: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyGroupService,
        { provide: 'IFamilyGroupRepository', useValue: familyGroupRepository },
        { provide: UserService, useValue: {} },
        { provide: ExpenseService, useValue: {} },
        { provide: RevenueService, useValue: {} },
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
});
