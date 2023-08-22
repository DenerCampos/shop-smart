import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { UpdateCouponDto } from './dto/updateCoupon.dto';
import { CreateCouponDto } from './dto/createCoupan.dto';
import { CouponModel } from './model/coupon.model';
import { AuthGuard } from 'src/auth/auth.guard';
import { paginationData } from 'src/common/pagination/pagination';
import { RequestWithUser } from 'src/common/types/requestType';

@Controller('/coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() createStoreDto: CreateCouponDto,
    @Req() req: RequestWithUser,
  ): Promise<CouponModel> {
    const user = req.user;

    return this.couponService.create(createStoreDto, user);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Req() req: RequestWithUser,
  ): Promise<paginationData<CouponModel>> {
    const user = req.user;

    return this.couponService.findAll(user, page, limit);
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
