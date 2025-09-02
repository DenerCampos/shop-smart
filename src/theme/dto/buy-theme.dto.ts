import { IsNotEmpty, IsString } from 'class-validator';

export class BuyThemeDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}
