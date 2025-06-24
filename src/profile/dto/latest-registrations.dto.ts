import { Expose } from 'class-transformer';

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
}
