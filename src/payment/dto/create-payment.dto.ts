import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { capitalizeFirstLetter } from 'src/common/utils/transformString';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => capitalizeFirstLetter(value))
  name: string;
}
