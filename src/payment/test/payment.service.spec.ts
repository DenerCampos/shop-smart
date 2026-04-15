import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../payment.service';
import { IPaymentRepository } from '../interface/payment.repository.interface';
import { AppConfig } from '../../common/app-config/app.config';
import { Pagination } from '../../common/pagination/pagination';
import { User } from '../../user/entities/user.entity';
import { UpdateException } from '../../exception/updateException';
import { createAppConfigMock } from '../../common/test/app-config.mock';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: jest.Mocked<
    Pick<IPaymentRepository, 'findAll' | 'find' | 'create'>
  >;

  const user = (): User => {
    const u = new User();
    u.id = 'u1';
    u.email = 'e@t.l';
    u.name = 'n';
    u.family = 'f';
    u.coatOfArms = '/c';
    u.password = 'p';
    return u;
  };

  beforeEach(async () => {
    paymentRepository = {
      findAll: jest.fn().mockResolvedValue([[], 0]),
      find: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: 'IPaymentRepository', useValue: paymentRepository },
        { provide: AppConfig, useValue: createAppConfigMock() },
        Pagination,
      ],
    }).compile();

    service = module.get(PaymentService);
  });

  it('findAll chama repositório com usuário e paginação', async () => {
    await service.findAll({ page: 1, limit: 10 } as any, user());

    expect(paymentRepository.findAll).toHaveBeenCalled();
  });

  it('update lança UpdateException quando pagamento não existe', async () => {
    paymentRepository.find.mockResolvedValue(null);

    await expect(
      service.update('x', { name: 'y' } as any),
    ).rejects.toBeInstanceOf(UpdateException);
  });
});
