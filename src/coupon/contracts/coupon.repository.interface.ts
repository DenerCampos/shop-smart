import { CreateCouponDto } from '../dto/createCoupan.dto';
import { UpdateCouponDto } from '../dto/updateCoupon.dto';
import { CouponModel } from '../model/coupon.model';

export interface ICouponRepository {
  create(data: CreateCouponDto): Promise<CouponModel>;
  findAll(): Promise<CouponModel[] | []>;
  find(id: string): Promise<CouponModel | null>;
  update(id: string, data: UpdateCouponDto): Promise<CouponModel | null>;
  remove(id: string): Promise<CouponModel | null>;
  delete(id: string): Promise<boolean>;
}
