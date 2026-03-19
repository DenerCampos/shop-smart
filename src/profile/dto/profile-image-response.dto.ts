import { Expose } from 'class-transformer';

export class ProfileImageResponseDto {
  @Expose()
  profileImage: string;
}
