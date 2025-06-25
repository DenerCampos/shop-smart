import { Exclude, Expose, Type } from 'class-transformer';
import { GroupResponseDto } from 'src/group/dto/group-response.dto';

export class ItemResponseDto {
  @Expose()
  id?: string;

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
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;

  @Exclude()
  deletedAt?: Date;

  @Expose()
  @Type(() => GroupResponseDto)
  group: GroupResponseDto;
}
