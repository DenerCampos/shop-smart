import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateThemeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  theme: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  requiredCoins: number;

  @IsNotEmpty()
  @IsString()
  background: string;
}
