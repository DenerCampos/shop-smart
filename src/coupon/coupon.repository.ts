import { Injectable } from '@nestjs/common';
import { Coupon } from './entities/coupon.entity';
import { Repository } from 'typeorm';
import { ICouponRepository } from './contracts/coupon.repository.interface';
import { CreateCouponDto } from './dto/create-coupan.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponRepository implements ICouponRepository {
  constructor(private couponEntity: Repository<Coupon>) {}
  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const coupon = this.couponEntity.create(createCouponDto);

    return this.couponEntity.save(coupon);
  }
  async findAll(): Promise<Coupon[]> {
    return this.couponEntity.find();
  }
  async find(id: number): Promise<Coupon> {
    return this.couponEntity.findOneBy({ id });
  }
  async update(id: number, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.couponEntity.findOneBy({ id });

    return this.couponEntity.save({ ...coupon, ...updateCouponDto });
  }
  async remove(id: number): Promise<Coupon> {
    const coupon = await this.couponEntity.findOneBy({ id });

    return this.couponEntity.remove(coupon);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.couponEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
