import { IsNotEmpty, IsString } from 'class-validator';

export class RemoveRecipePhotoDto {
  @IsNotEmpty()
  @IsString()
  photoUrl: string;
}
