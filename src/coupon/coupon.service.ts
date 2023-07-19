import { Injectable } from '@nestjs/common';
import { CreateCouponDto } from './dto/createCoupan.dto';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { CouponModel } from './model/coupon.model';
import { ICouponRepository } from './contracts/coupon.repository.interface';

@Injectable()
export class CouponService {
  constructor(private couponRepository: ICouponRepository) {}

  async create(createCouponDto: CreateCouponDto): Promise<CouponModel> {
    const coupon = await this.couponRepository.create(createCouponDto);

    return coupon;
  }

  async findAll(): Promise<CouponModel[] | []> {
    const coupons = await this.couponRepository.findAll();
    return coupons;
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
