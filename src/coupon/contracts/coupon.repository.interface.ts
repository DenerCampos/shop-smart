import { User } from 'src/user/entities/user.entity';
import { CreateCouponDto } from '../dto/createCoupan.dto';
import { UpdateCouponDto } from '../dto/updateCoupon.dto';
import { CouponModel } from '../model/coupon.model';

export interface ICouponRepository {
  create(data: CreateCouponDto, user: User): Promise<CouponModel>;
  findAll(user: User, page: number, limit: number): Promise<CouponModel[] | []>;
  find(id: string, user: User): Promise<CouponModel | null>;
  update(
    id: string,
    data: UpdateCouponDto,
    user: User,
  ): Promise<CouponModel | null>;
  remove(id: string, user: User): Promise<CouponModel | null>;
  delete(id: string, user: User): Promise<boolean>;
  countAll(user: User): Promise<number>;
}
