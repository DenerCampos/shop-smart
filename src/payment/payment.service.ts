import { Inject, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { IPaymentRepository } from './interface/payment.repository.interface';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { Payment } from './entities/payment.entity';
import { PaymentListDto } from './dto/payment-list.dto';

@Injectable()
export class PaymentService {
  private url = `${this.appConfig.getBaseUrl()}/payment`;

  constructor(
    @Inject('IPaymentRepository')
    private paymentRepository: IPaymentRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentRepository.create(createPaymentDto);
  }

  async findAll(paymentList: PaymentListDto): Promise<paginationData<Payment>> {
    const offset = this.pagination.getOffset(
      paymentList.page,
      paymentList.limit,
    );

    const [payments, total] = await this.paymentRepository.findAll(
      offset,
      paymentList.limit,
    );

    const paginateData = this.pagination.paginateData<Payment>(
      payments,
      paymentList.page,
      paymentList.limit,
      total,
      this.url,
    );

    return paginateData;
  }

  async find(paymentId: string): Promise<Payment | null> {
    return this.paymentRepository.find(paymentId);
  }

  async update(
    paymentId: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    return this.paymentRepository.update(paymentId, updatePaymentDto);
  }

  async delete(paymentId: string): Promise<boolean> {
    return this.paymentRepository.delete(paymentId);
  }
}
