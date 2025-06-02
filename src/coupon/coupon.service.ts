import { Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/createCoupan.dto';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { CouponModel } from './model/coupon.model';
import { ICouponRepository } from './contracts/coupon.repository.interface';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { User } from 'src/user/entities/user.entity';
import { itemType } from './types/itemType';
import { CoinService } from 'src/coin/coin.service';
import { ExpenseService } from 'src/expense/expense.service';
import { RevenueService } from 'src/revenue/revenue.service';
import { coinType } from 'src/coin/types/coinType';
import { logResultsPromises, withTimeout } from 'src/common/utils/helpPromises';

@Injectable()
export class CouponService {
  private url = `${this.appConfig.getBaseUrl()}/coupon`;

  constructor(
    private couponRepository: ICouponRepository,
    private pagination: Pagination,
    private appConfig: AppConfig,
    private coinService: CoinService,
    private expenseService: ExpenseService,
    private revenueService: RevenueService,
  ) {}

  async create(
    createCouponDto: CreateCouponDto,
    user: User,
  ): Promise<CouponModel> {
    createCouponDto.value = this.calculateTotalValue(createCouponDto.items);

    const coupon = await this.couponRepository.create(createCouponDto, user);

    const results = await Promise.allSettled([
      withTimeout(this.addCoins(user, 'coupon')),
      withTimeout(this.addExpenses(user, coupon)),
    ]);

    //Log results promises
    logResultsPromises(results, ['addCoins', 'addExpenses']);

    return coupon;
  }

  async addCoins(user: User, typeCoins: coinType): Promise<void> {
    await this.coinService.addCoins(user, { type: typeCoins });
  }

  async addExpenses(user: User, coupon: CouponModel): Promise<void> {
    await this.expenseService.create(user, {
      name: coupon.store.name,
      value: coupon.value,
      repeat: false,
    });
  }

  async addRevenues(
    user: User,
    coupon: CouponModel,
    repeat: boolean,
  ): Promise<void> {
    await this.revenueService.create(user, {
      name: coupon.store.name,
      value: coupon.value,
      repeat: repeat,
    });
  }

  private calculateTotalValue = (items: itemType[]): number => {
    if (!items || items.length === 0) return 0;

    const total = items.reduce((total, item) => {
      const itemTotal =
        typeof item.total === 'number' && !isNaN(item.total) ? item.total : 0;
      return total + itemTotal;
    }, 0);

    return Number((Math.ceil(total * 100) / 100).toFixed(2));
  };

  async findAll(
    user: User,
    page: number,
    limit: number,
  ): Promise<paginationData<CouponModel>> {
    const offset = this.pagination.getOffset(page, limit);

    const coupons = await this.couponRepository.findAll(user, offset, limit);
    const total = await this.couponRepository.countAll(user);

    const paginateData = this.pagination.paginateData<CouponModel>(
      coupons,
      page,
      limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async find(couponId: string, user: User): Promise<CouponModel | null> {
    return await this.couponRepository.find(couponId, user);
  }

  async update(
    couponId: string,
    updateCouponDto: UpdateCouponDto,
    user: User,
  ): Promise<CouponModel> {
    return await this.couponRepository.update(couponId, updateCouponDto, user);
  }

  async remove(couponId: string, user: User): Promise<CouponModel> {
    return await this.couponRepository.remove(couponId, user);
  }

  async delete(couponId: string, user: User): Promise<boolean> {
    return await this.couponRepository.delete(couponId, user);
  }
}
