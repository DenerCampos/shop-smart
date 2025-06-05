import { Exclude, Expose } from 'class-transformer';

export class ProfileDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  family: string;

  @Expose()
  income: number;

  @Expose()
  expenses: number;

  @Expose()
  coins: number;

  @Expose()
  coatOfArms: string;

  @Expose()
  isFirstAccess: boolean;

  @Exclude()
  password: string;

  @Exclude()
  token: string;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  constructor(data: Partial<ProfileDto>) {
    Object.assign(this, data);
  }
}
