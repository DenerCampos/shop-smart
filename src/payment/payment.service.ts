import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { CreatePaymentDto } from './dto/createPayment.dto';
import { UpdatePaymentDto } from './dto/updatePayment.dto';
import { PaymentModel } from './model/payment.model';

@Injectable()
export class PaymentService {
  constructor(private paymentRepository: PaymentRepository) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentModel> {
    return this.paymentRepository.create(createPaymentDto);
  }

  async findAll(): Promise<PaymentModel[] | []> {
    return this.paymentRepository.findAll();
  }

  async find(paymentId: number): Promise<PaymentModel | null> {
    return this.paymentRepository.find(paymentId);
  }

  async update(
    paymentId: number,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentModel> {
    return this.paymentRepository.update(paymentId, updatePaymentDto);
  }

  async delete(paymentId: number): Promise<boolean> {
    return this.paymentRepository.delete(paymentId);
  }
}
