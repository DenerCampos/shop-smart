import { Type } from 'class-transformer';
import {
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AlexaSlotDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  confirmationStatus?: string;
}

export class AlexaIntentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  confirmationStatus?: string;

  @IsOptional()
  @IsObject()
  slots?: Record<string, AlexaSlotDto>;
}

export class AlexaRequestDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  requestId?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AlexaIntentDto)
  intent?: AlexaIntentDto;
}

export class AlexaSessionUserDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class AlexaSessionDto {
  @IsOptional()
  new?: boolean;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AlexaSessionUserDto)
  user?: AlexaSessionUserDto;
}

export class AlexaSystemUserDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;
}

export class AlexaSystemDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AlexaSystemUserDto)
  user?: AlexaSystemUserDto;
}

export class AlexaContextDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AlexaSystemDto)
  System?: AlexaSystemDto;
}

export class AlexaIntentRequestDto {
  @IsString()
  version: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AlexaSessionDto)
  session?: AlexaSessionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AlexaContextDto)
  context?: AlexaContextDto;

  @ValidateNested()
  @Type(() => AlexaRequestDto)
  request: AlexaRequestDto;
}
