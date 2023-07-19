import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/createPayment.dto';
import { UpdatePaymentDto } from './dto/updatePayment.dto';
import { PaymentModel } from './model/payment.model';
import { IPaymentRepository } from './contracts/payment.repository.interface';

@Injectable()
export class PaymentService {
  constructor(private paymentRepository: IPaymentRepository) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentModel> {
    return this.paymentRepository.create(createPaymentDto);
  }

  async findAll(): Promise<PaymentModel[] | []> {
    return this.paymentRepository.findAll();
  }

  async find(paymentId: string): Promise<PaymentModel | null> {
    return this.paymentRepository.find(paymentId);
  }

  async update(
    paymentId: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentModel> {
    return this.paymentRepository.update(paymentId, updatePaymentDto);
  }

  async delete(paymentId: string): Promise<boolean> {
    return this.paymentRepository.delete(paymentId);
  }
}
