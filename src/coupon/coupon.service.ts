import { Injectable } from '@nestjs/common';
import { CouponRepository } from './coupon.repository';
import { CreateCouponDto } from './dto/createCoupan.dto';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { CouponModel } from './model/coupon.model';

@Injectable()
export class CouponService {
  constructor(private couponRepository: CouponRepository) {}

  async create(createCouponDto: CreateCouponDto): Promise<CouponModel> {
    const coupon = await this.couponRepository.create(createCouponDto);

    return coupon;
  }

  async findAll(): Promise<CouponModel[]> {
    const coupons = await this.couponRepository.findAll();
    return coupons;
  }

  async find(couponId: number): Promise<CouponModel> {
    return await this.couponRepository.find(couponId);
  }

  async update(
    couponId: number,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponModel> {
    return await this.couponRepository.update(couponId, updateCouponDto);
  }

  async remove(couponId: number): Promise<CouponModel> {
    return await this.couponRepository.remove(couponId);
  }

  async delete(couponId: number): Promise<boolean> {
    return await this.couponRepository.delete(couponId);
  }
}
