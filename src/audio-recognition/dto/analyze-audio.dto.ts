import { IsOptional, IsString } from 'class-validator';

export class AnalyzeAudioDto {
  @IsOptional()
  @IsString()
  provider?: string;
}
