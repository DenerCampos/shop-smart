import { Exclude, Expose } from 'class-transformer';

export class ThemeResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  theme: string;

  @Expose()
  description: string;

  @Expose()
  requiredCoins: number;

  @Expose()
  background: string;

  @Expose()
  isUnlocked: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
