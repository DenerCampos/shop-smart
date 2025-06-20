import { Exclude, Expose } from 'class-transformer';

export class RevenueResponseDto {
  @Exclude()
  id: string;

  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  repeat: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
