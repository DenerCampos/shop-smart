import { CreateCouponDto } from '../dto/createCoupan.dto';
import { UpdateCouponDto } from '../dto/updateCoupon.dto';
import { CouponModel } from '../model/coupon.model';

export interface ICouponRepository {
  create(data: CreateCouponDto): Promise<CouponModel>;
  findAll(): Promise<CouponModel[] | []>;
  find(id: number): Promise<CouponModel | null>;
  update(id: number, data: UpdateCouponDto): Promise<CouponModel | null>;
  remove(id: number): Promise<CouponModel | null>;
  delete(id: number): Promise<boolean>;
}
