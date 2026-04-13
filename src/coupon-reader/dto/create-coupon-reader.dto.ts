import { IsNotEmpty, IsUrl } from 'class-validator';

export class CreateCouponReaderDto {
  @IsNotEmpty()
  @IsUrl({ require_tld: true, require_protocol: true })
  url: string;
}
