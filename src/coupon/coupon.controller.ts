import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { CreateCouponDto } from './dto/create-coupan.dto';
import { CouponModel } from './model/coupon.model';

@Controller('/coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  create(@Body() createStoreDto: CreateCouponDto): Promise<CouponModel> {
    return this.couponService.create(createStoreDto);
  }

  @Get()
  findAll(): Promise<CouponModel[]> {
    return this.couponService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<CouponModel> {
    return this.couponService.find(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateStoreDto: UpdateCouponDto,
  ): Promise<CouponModel> {
    return this.couponService.update(id, updateStoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<boolean> {
    return this.couponService.delete(id);
  }
}
