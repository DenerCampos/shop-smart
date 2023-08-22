import { Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/createCoupan.dto';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { CouponModel } from './model/coupon.model';
import { ICouponRepository } from './contracts/coupon.repository.interface';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { AppConfig } from 'src/common/app-config/app.config';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class CouponService {
  private url = `${this.appConfig.getBaseUrl()}/coupon`;

  constructor(
    private couponRepository: ICouponRepository,
    private pagination: Pagination,
    private appConfig: AppConfig,
  ) {}

  async create(
    createCouponDto: CreateCouponDto,
    user: User,
  ): Promise<CouponModel> {
    return await this.couponRepository.create(createCouponDto, user);
  }

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

  async find(couponId: string): Promise<CouponModel | null> {
    return await this.couponRepository.find(couponId);
  }

  async update(
    couponId: string,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponModel> {
    return await this.couponRepository.update(couponId, updateCouponDto);
  }

  async remove(couponId: string): Promise<CouponModel> {
    return await this.couponRepository.remove(couponId);
  }

  async delete(couponId: string): Promise<boolean> {
    return await this.couponRepository.delete(couponId);
  }
}
