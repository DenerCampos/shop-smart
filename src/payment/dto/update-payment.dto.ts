import { IsOptional } from 'class-validator';
import { CreatePaymentDto } from './create-payment.dto';
import { PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { capitalizeFirstLetter } from 'src/common/utils/transformString';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsOptional()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;
}
