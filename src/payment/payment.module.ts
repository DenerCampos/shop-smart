import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { UserModule } from 'src/user/user.module';
import { CommonModule } from 'src/common/common.module';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './repositories/payment.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [CommonModule, UserModule, TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: 'IPaymentRepository',
      useClass: PaymentRepository,
    },
  ],
  exports: [PaymentService, 'IPaymentRepository'],
})
export class PaymentModule {}
