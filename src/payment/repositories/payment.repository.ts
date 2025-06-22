import { Injectable } from '@nestjs/common';
import { EntityManager, Equal, ILike, Not, Repository } from 'typeorm';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
import { RemoveException } from 'src/exception/removeException';
import { IPaymentRepository } from '../interface/payment.repository.interface';
import { Payment } from '../entities/payment.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private paymentEntity: Repository<Payment>,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    manager?: EntityManager,
  ): Promise<Payment> {
    const repository = manager
      ? manager.getRepository(Payment)
      : this.paymentEntity;

    const existingPayment = await repository.findOne({
      where: {
        name: ILike(`%${createPaymentDto.name}%`),
      },
    });

    if (existingPayment) {
      return existingPayment;
    }

    const payment = repository.create(createPaymentDto);
    return repository.save(payment);
  }

  async findAll(page: number, limit: number): Promise<[Payment[], number]> {
    const queryBuilder = this.paymentEntity.createQueryBuilder('payment');

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    return await queryBuilder.getManyAndCount();
  }

  async find(id: string): Promise<Payment | null> {
    return await this.paymentEntity.findOneBy({ id });
  }

  async countAll(): Promise<number> {
    return await this.paymentEntity.count({
      withDeleted: false,
    });
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const updatePayment = await this.paymentEntity.findOneBy({ id });

    if (!updatePayment) {
      throw new UpdateException();
    }

    const existPayment = await this.paymentEntity.findOne({
      where: {
        name: ILike(`%${updatePaymentDto.name}%`),
        id: Not(Equal(updatePayment.id)),
      },
    });

    if (existPayment) {
      //TODO Olhar depois - https://docs.nestjs.com/exception-filters
      throw new AlreadyExistsException();
    }

    const payment = await this.paymentEntity.save({
      ...updatePayment,
      ...updatePaymentDto,
    });

    return payment;
  }

  async remove(id: string): Promise<Payment> {
    const payment = await this.paymentEntity.findOneBy({ id });

    if (payment) {
      //TODO Olhar depois - https://docs.nestjs.com/exception-filters
      throw new RemoveException();
    }

    await this.paymentEntity.remove(payment);
    return payment;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.paymentEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
