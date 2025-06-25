import { Expose, Type } from 'class-transformer';
import { GroupResponseDto } from 'src/group/dto/group-response.dto';

export class CouponReaderItemResponseDto {
  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  quantity: number;

  @Expose()
  unit: string;

  @Expose()
  value: number;

  @Expose()
  total: number;

  @Expose()
  @Type(() => GroupResponseDto)
  group: GroupResponseDto;
}
