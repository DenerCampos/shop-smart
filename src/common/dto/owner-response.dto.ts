import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class OwnerResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  profileImage: string | null;
}
