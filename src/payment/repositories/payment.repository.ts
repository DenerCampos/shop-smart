import { Injectable } from '@nestjs/common';
import { EntityManager, Equal, ILike, Not, Repository } from 'typeorm';
import { RemoveException } from 'src/exception/removeException';
import { IPaymentRepository } from '../interface/payment.repository.interface';
import { Payment } from '../entities/payment.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(Payment)
    private paymentEntity: Repository<Payment>,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    user: User,
    manager?: EntityManager,
  ): Promise<Payment> {
    const repository = manager
      ? manager.getRepository(Payment)
      : this.paymentEntity;

    const existingPayment = await repository.findOne({
      where: {
        name: ILike(`%${createPaymentDto.name}%`),
        user: user,
      },
    });

    if (existingPayment) {
      return existingPayment;
    }

    const payment = repository.create({
      ...createPaymentDto,
      user: user,
    });
    return repository.save(payment);
  }

  async findAll(
    user: User,
    page: number,
    limit: number,
    search?: string,
  ): Promise<[Payment[], number]> {
    const queryBuilder = this.paymentEntity.createQueryBuilder('payment');

    queryBuilder.where('payment.userId = :userId', { userId: user.id });

    if (page !== undefined && limit !== undefined) {
      queryBuilder.skip(page).take(limit);
    }

    if (search) {
      queryBuilder.where('LOWER(payment.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    queryBuilder.orderBy('payment.createdAt', 'DESC');

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
    payment: Payment,
    updatePaymentDto: UpdatePaymentDto,
    manager?: EntityManager,
  ): Promise<Payment> {
    const repository = manager
      ? manager.getRepository(Payment)
      : this.paymentEntity;

    return await repository.save({
      ...payment,
      ...updatePaymentDto,
    });
  }

  async exist(name: string, payment: Payment): Promise<boolean> {
    const existPayment = await this.paymentEntity.findOne({
      where: {
        name: ILike(`%${name}%`),
        id: Not(Equal(payment.id)),
      },
    });

    return existPayment ? true : false;
  }

  async findByName(name: string): Promise<Payment | null> {
    return await this.paymentEntity.findOne({
      where: {
        name: ILike(`%${name}%`),
      },
    });
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
