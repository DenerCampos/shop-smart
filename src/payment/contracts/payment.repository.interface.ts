import { CreatePaymentDto } from '../dto/createPayment.dto';
import { UpdatePaymentDto } from '../dto/updatePayment.dto';
import { PaymentModel } from '../model/payment.model';

export interface IPaymentRepository {
  create(newStore: CreatePaymentDto): Promise<PaymentModel>;
  findAll(): Promise<PaymentModel[] | []>;
  find(id: string): Promise<PaymentModel | null>;
  update(id: string, updateStore: UpdatePaymentDto): Promise<PaymentModel>;
  remove(id: string): Promise<PaymentModel>;
  delete(id: string): Promise<boolean>;
}
