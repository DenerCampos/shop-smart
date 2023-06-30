import { CreatePaymentDto } from '../dto/createPayment.dto';
import { UpdatePaymentDto } from '../dto/updatePayment.dto';
import { PaymentModel } from '../model/payment.model';

export interface IPaymentRepository {
  create(newStore: CreatePaymentDto): Promise<PaymentModel>;
  findAll(): Promise<PaymentModel[] | []>;
  find(id: number): Promise<PaymentModel | null>;
  update(id: number, updateStore: UpdatePaymentDto): Promise<PaymentModel>;
  remove(id: number): Promise<PaymentModel>;
  delete(id: number): Promise<boolean>;
}
