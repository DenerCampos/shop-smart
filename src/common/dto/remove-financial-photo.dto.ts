import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveFinancialPhotoDto {
  @IsString()
  @IsNotEmpty()
  photoUrl: string;
}
