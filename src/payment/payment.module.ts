import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { DataSource } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [PaymentController],
  providers: [
    {
      provide: PaymentRepository,
      useFactory: (dataSource: DataSource) => {
        return new PaymentRepository(dataSource.getRepository(Payment));
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: PaymentService,
      useFactory: (gateway: PaymentRepository) => {
        return new PaymentService(gateway);
      },
      inject: [PaymentRepository],
    },
  ],
})
export class PaymentModule {}
