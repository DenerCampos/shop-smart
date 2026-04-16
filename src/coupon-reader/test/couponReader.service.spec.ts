jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { CouponReaderService } from '../couponReader.service';
import { StoreService } from '../../store/store.service';
import { TextRecognitionService } from '../../text-recognition/textRecognition.service';
import { User } from '../../user/entities/user.entity';
import { CouponTextResult } from '../../text-recognition/types/textRecognitionType';

describe('CouponReaderService', () => {
  let service: CouponReaderService;
  let textRecognition: jest.Mocked<Pick<TextRecognitionService, 'parseCoupon'>>;
  let storeService: jest.Mocked<Pick<StoreService, 'getAllNames'>>;

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
    textRecognition = { parseCoupon: jest.fn() };
    storeService = { getAllNames: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponReaderService,
        { provide: StoreService, useValue: storeService },
        { provide: TextRecognitionService, useValue: textRecognition },
      ],
    }).compile();

    service = module.get(CouponReaderService);
  });

  it('read busca HTML, interpreta cupom e retorna uri', async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: '<html><div class="container">conteudo cupom</div></html>',
    });

    const coupon: CouponTextResult = {
      name: 'Mercado',
      value: 42.5,
      date: '2024-06-01',
      repeat: false,
      items: [],
      store: { name: 'Mercado' },
      payment: { name: 'Pix' },
      confidence: 0.9,
      provider: 'gemini',
    };
    textRecognition.parseCoupon.mockResolvedValue(coupon);

    const result = await service.read('https://exemplo.local/nf', user());

    expect(result.uri).toBe('https://exemplo.local/nf');
    expect(result.name).toBe('Mercado');
    expect(textRecognition.parseCoupon).toHaveBeenCalled();
  });
});
