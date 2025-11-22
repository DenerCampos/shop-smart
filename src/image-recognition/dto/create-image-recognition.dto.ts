import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsEnum,
  IsJSON,
} from 'class-validator';
import { RecognitionStatus } from '../types/imageRecognitionType';

export class CreateImageRecognitionDto {
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsEnum(RecognitionStatus)
  status: RecognitionStatus;

  @IsOptional()
  confidence: number;

  @IsOptional()
  @IsJSON()
  result?: object;

  @IsOptional()
  @IsString()
  error?: string;
}
