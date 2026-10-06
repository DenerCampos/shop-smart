import { Expose } from 'class-transformer';

export class StatusResponseDto {
  @Expose()
  status: string;
}
