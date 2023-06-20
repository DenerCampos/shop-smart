import { CreateCouponDto } from './create-coupan.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
