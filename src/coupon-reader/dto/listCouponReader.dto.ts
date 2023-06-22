import { IsNotEmpty, IsString } from 'class-validator';

export class listCouponReaderDto {
  @IsNotEmpty()
  @IsString()
  url: string;
}
