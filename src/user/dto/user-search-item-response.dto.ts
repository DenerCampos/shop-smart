import { Expose } from 'class-transformer';

export class UserSearchItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;
}
