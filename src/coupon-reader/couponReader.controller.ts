import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CouponReaderService } from './couponReader.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CouponReaderResponseDto } from './dto/coupon-reader-response.dto';
import { ResponseService } from 'src/common/response/response';
import { CreateCouponReaderDto } from './dto/create-coupon-reader.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Controller('/coupon-reader')
export class CouponReaderController {
  constructor(
    private readonly couponReaderService: CouponReaderService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  @HttpCode(HttpStatus.OK)
  async read(
    @Body() dto: CreateCouponReaderDto,
    @CurrentUser() user: User,
  ): Promise<CouponReaderResponseDto> {
    const result = await this.couponReaderService.read(dto.url, user);

    return this.responseService.mapToDto(CouponReaderResponseDto, result);
  }
}
