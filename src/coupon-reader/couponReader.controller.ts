import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CouponReaderService } from './couponReader.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CouponReaderResponseDto } from './dto/coupon-reader-response.dto';
import { ResponseService } from 'src/common/response/response';

@Controller('/coupon-reader')
export class CouponReaderController {
  constructor(
    private readonly groupService: CouponReaderService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Get(':url')
  async read(@Param('url') url: string): Promise<CouponReaderResponseDto> {
    const result = await this.groupService.read(url);

    return this.responseService.mapToDto(CouponReaderResponseDto, result);
  }
}
