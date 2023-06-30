import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { UpdatePaymentDto } from './dto/updatePayment.dto';
import { CreatePaymentDto } from './dto/createPayment.dto';
import { PaymentModel } from './model/payment.model';

@Controller('/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentModel> {
    return this.paymentService.create(createPaymentDto);
  }

  @Get()
  findAll(): Promise<PaymentModel[]> {
    return this.paymentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<PaymentModel> {
    return this.paymentService.find(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentModel> {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<object> {
    const deleted = await this.paymentService.delete(id);

    return { deleted };
  }
}
