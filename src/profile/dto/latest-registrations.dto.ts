import { Expose, Type } from 'class-transformer';
import { OwnerResponseDto } from 'src/common/dto/owner-response.dto';

export class LatestRegistrationsDto {
  @Expose()
  id: string | number;

  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  coins: number;

  @Expose()
  type: string;

  @Expose()
  date: Date;

  @Expose()
  @Type(() => OwnerResponseDto)
  user: OwnerResponseDto;
}
