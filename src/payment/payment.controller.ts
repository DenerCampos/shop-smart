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
import { PaymentService } from './payment.service';
import { UpdatePaymentDto } from './dto/updatePayment.dto';
import { CreatePaymentDto } from './dto/createPayment.dto';
import { PaymentModel } from './model/payment.model';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentModel> {
    return this.paymentService.create(createPaymentDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(): Promise<PaymentModel[]> {
    return this.paymentService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<PaymentModel> {
    return this.paymentService.find(id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentModel> {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<object> {
    const deleted = await this.paymentService.delete(id);

    return { deleted };
  }
}
