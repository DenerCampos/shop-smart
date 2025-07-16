import { Exclude, Expose } from 'class-transformer';

export class RevenueResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  value: number;

  @Expose()
  repeat: boolean;

  @Expose()
  date: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
