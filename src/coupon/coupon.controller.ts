import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { CreateCouponDto } from './dto/createCoupan.dto';
import { CouponModel } from './model/coupon.model';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('/coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createStoreDto: CreateCouponDto): Promise<CouponModel> {
    return this.couponService.create(createStoreDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<CouponModel[]> {
    return this.couponService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<CouponModel> {
    return this.couponService.find(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateCouponDto,
  ): Promise<CouponModel> {
    return this.couponService.update(id, updateStoreDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<object> {
    const deleted = await this.couponService.delete(id);

    return { deleted };
  }
}
