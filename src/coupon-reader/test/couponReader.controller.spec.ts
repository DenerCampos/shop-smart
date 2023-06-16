import { Test, TestingModule } from '@nestjs/testing';
import { CouponReaderController } from '../couponReader.controller';
import { CouponReaderService } from '../couponReader.service';

describe('CouponReaderController', () => {
  let couponReader: CouponReaderController;

  beforeEach(async () => {
    const group: TestingModule = await Test.createTestingModule({
      controllers: [CouponReaderController],
      providers: [CouponReaderService],
    }).compile();

    couponReader = group.get<CouponReaderController>(CouponReaderController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(couponReader.read('teste')).toBe('teste');
    });
  });
});
