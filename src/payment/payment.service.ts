import { Inject, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { IPaymentRepository } from './interface/payment.repository.interface';
import { AppConfig } from 'src/common/app-config/app.config';
import { Pagination, paginationData } from 'src/common/pagination/pagination';
import { Payment } from './entities/payment.entity';
import { PaymentListDto } from './dto/payment-list.dto';
import { EntityManager } from 'typeorm';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class PaymentService {
  private url = `${this.appConfig.getBaseUrl()}/payment`;

  constructor(
    @Inject('IPaymentRepository')
    private paymentRepository: IPaymentRepository,
    private appConfig: AppConfig,
    private pagination: Pagination,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    user: User,
    manager?: EntityManager,
  ): Promise<Payment> {
    return this.paymentRepository.create(createPaymentDto, user, manager);
  }

  async findAll(
    paymentList: PaymentListDto,
    user: User,
  ): Promise<paginationData<Payment>> {
    const offset = this.pagination.getOffset(
      paymentList.page,
      paymentList.limit,
    );

    const [payments, total] = await this.paymentRepository.findAll(
      user,
      offset,
      paymentList.limit,
      paymentList.search,
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
    manager?: EntityManager,
  ): Promise<Payment> {
    const updatePayment = await this.paymentRepository.find(paymentId);

    if (!updatePayment) {
      throw new UpdateException();
    }

    const existPayment = await this.paymentRepository.exist(
      updatePaymentDto.name,
      updatePayment,
    );

    if (existPayment) {
      throw new AlreadyExistsException();
    }

    return this.paymentRepository.update(
      updatePayment,
      updatePaymentDto,
      manager,
    );
  }

  async findByName(name: string): Promise<Payment | null> {
    return this.paymentRepository.findByName(name);
  }

  async delete(paymentId: string): Promise<boolean> {
    return this.paymentRepository.delete(paymentId);
  }
}
