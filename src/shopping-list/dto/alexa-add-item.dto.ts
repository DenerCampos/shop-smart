import { IsNotEmpty, IsString } from 'class-validator';

export class AlexaAddItemDto {
  @IsNotEmpty()
  @IsString()
  text: string;
}
