import { EntityManager } from 'typeorm';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { Payment } from '../entities/payment.entity';
import { User } from 'src/user/entities/user.entity';

export interface IPaymentRepository {
  create(
    createPaymentDto: CreatePaymentDto,
    user: User,
    manager?: EntityManager,
  ): Promise<Payment>;
  findAll(
    user: User,
    page: number,
    limit: number,
    search?: string,
  ): Promise<[Payment[], number]>;
  find(id: string): Promise<Payment | null>;
  update(
    payment: Payment,
    updateStore: UpdatePaymentDto,
    manager?: EntityManager,
  ): Promise<Payment>;
  remove(id: string): Promise<Payment>;
  delete(id: string): Promise<boolean>;
  countAll(): Promise<number>;
  exist(name: string, payment: Payment): Promise<boolean>;
  findByName(name: string, user: User): Promise<Payment | null>;
}
