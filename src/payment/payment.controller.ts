import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { ResponseService } from 'src/common/response/response';
import { paginationData } from 'src/common/pagination/pagination';
import { PaymentListDto } from './dto/payment-list.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from 'src/user/entities/user.entity';

@Controller('/payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly responseService: ResponseService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: User,
  ): Promise<PaymentResponseDto> {
    const createPayment = await this.paymentService.create(
      createPaymentDto,
      user,
    );

    return this.responseService.mapToDto(PaymentResponseDto, createPayment);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query() listDto: PaymentListDto,
    @CurrentUser() user: User,
  ): Promise<paginationData<PaymentResponseDto>> {
    const payments = await this.paymentService.findAll(listDto, user);

    return this.responseService.mapPaginatedToDto(PaymentResponseDto, payments);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.find(id);

    return this.responseService.mapToDto(PaymentResponseDto, payment);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentService.update(id, updatePaymentDto);

    return this.responseService.mapToDto(PaymentResponseDto, payment);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<object> {
    const deleted = await this.paymentService.delete(id);

    return { deleted };
  }
}
