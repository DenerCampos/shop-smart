import { CreateCouponDto } from './createCoupan.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
