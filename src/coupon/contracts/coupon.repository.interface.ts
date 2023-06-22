import { CreateCouponDto } from '../dto/create-coupan.dto';
import { UpdateCouponDto } from '../dto/update-coupon.dto';
import { Coupon } from '../entities/coupon.entity';

export interface ICouponRepository {
  create(data: CreateCouponDto): Promise<Coupon>;
  findAll(): Promise<Coupon[]>;
  find(id: number): Promise<Coupon>;
  update(id: number, data: UpdateCouponDto): Promise<Coupon>;
  remove(id: number): Promise<Coupon>;
  delete(id: number): Promise<boolean>;
}
