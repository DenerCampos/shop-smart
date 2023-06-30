import { Injectable } from '@nestjs/common';
import { Payment } from './entities/payment.entity';
import { Equal, ILike, Not, Repository } from 'typeorm';
import { IPaymentRepository } from './contracts/payment.repository.interface';
import { CreatePaymentDto } from './dto/createPayment.dto';
import { UpdatePaymentDto } from './dto/updatePayment.dto';
import { PaymentModel } from './model/payment.model';
import { UpdateException } from 'src/exception/updateException';
import { AlreadyExistsException } from 'src/exception/alreadyExistsException';
import { RemoveException } from 'src/exception/removeException';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(private paymentEntity: Repository<Payment>) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<PaymentModel> {
    const payment = await this.paymentEntity.findOne({
      where: {
        name: ILike(`%${createPaymentDto.name}%`),
      },
    });

    if (payment) {
      return new PaymentModel(payment);
    } else {
      const newPayment = this.paymentEntity.create(createPaymentDto);

      const savedPayment = await this.paymentEntity.save(newPayment);
      return new PaymentModel(savedPayment);
    }
  }

  async findAll(): Promise<PaymentModel[] | []> {
    const payments = await this.paymentEntity.find();

    if (payments) {
      return payments.map((payment) => new PaymentModel(payment));
    }

    return [];
  }

  async find(id: number): Promise<PaymentModel | null> {
    const payment = await this.paymentEntity.findOneBy({ id });

    if (payment) {
      return new PaymentModel(payment);
    }

    return payment;
  }

  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentModel> {
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

    return new PaymentModel(payment);
  }

  async remove(id: number): Promise<PaymentModel> {
    const payment = await this.paymentEntity.findOneBy({ id });

    if (payment) {
      //TODO Olhar depois - https://docs.nestjs.com/exception-filters
      throw new RemoveException();
    }

    await this.paymentEntity.remove(payment);
    return new PaymentModel(payment);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.paymentEntity.softDelete({ id });

    return result.affected === 1 ? true : false;
  }
}
