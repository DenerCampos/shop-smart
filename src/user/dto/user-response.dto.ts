import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Exclude()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Expose()
  family: string;

  @Expose()
  coatOfArms: string;

  @Exclude()
  token: string;

  @Exclude()
  refreshtoken: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
