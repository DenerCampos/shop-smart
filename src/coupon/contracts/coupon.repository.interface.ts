import { Coupon } from '../entities/coupon.entity';

export interface ICouponRepository {
  create(newCoupon: Coupon): Promise<Coupon>;
  findAll(): Promise<Coupon[]>;
  find(id: number): Promise<Coupon>;
  update(id: number, updateCoupon: Coupon): Promise<Coupon>;
  remove(id: number): Promise<Coupon>;
  delete(id: number): Promise<boolean>;
}
