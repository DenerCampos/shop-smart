import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRevenueDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsNotEmpty()
  @IsBoolean()
  repeat: boolean;
}
