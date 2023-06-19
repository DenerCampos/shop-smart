import { Injectable } from '@nestjs/common';
import { CouponRepository } from './coupon.repository';
import { CreateCouponDto } from './dto/create-coupan.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CouponModel } from './model/coupon.model';

@Injectable()
export class CouponService {
  constructor(private couponRepository: CouponRepository) {}

  async create(createCouponDto: CreateCouponDto): Promise<CouponModel> {
    const coupon = await this.couponRepository.create(createCouponDto);

    return new CouponModel({ id: coupon.id });
  }

  async findAll(): Promise<CouponModel[]> {
    const coupons = await this.couponRepository.findAll();
    return coupons.map(({ id }) => new CouponModel({ id }));
  }

  async find(couponId: number): Promise<CouponModel> {
    const { id } = await this.couponRepository.find(couponId);
    return new CouponModel({ id });
  }

  async update(
    couponId: number,
    updateCouponDto: UpdateCouponDto,
  ): Promise<CouponModel> {
    const { id } = await this.couponRepository.update(
      couponId,
      updateCouponDto,
    );
    return new CouponModel({ id });
  }

  async remove(couponId: number): Promise<CouponModel> {
    const { id } = await this.couponRepository.remove(couponId);
    return new CouponModel({ id });
  }

  async delete(couponId: number): Promise<boolean> {
    return await this.couponRepository.delete(couponId);
  }
}
