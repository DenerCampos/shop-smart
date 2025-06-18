import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CompleteProfileDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  family: string;

  @IsNotEmpty()
  @IsNumber()
  income: number;

  @IsNotEmpty()
  @IsBoolean()
  repeatMonthly?: boolean;
}
