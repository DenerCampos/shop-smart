import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChoreRejectDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  reason: string;
}
