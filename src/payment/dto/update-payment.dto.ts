import { IsOptional } from 'class-validator';
import { CreatePaymentDto } from './create-payment.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsOptional()
  name: string;
}
