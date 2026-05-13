import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateChoreDefinitionDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rewardValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coinReward?: number;

  @IsOptional()
  @IsBoolean()
  requirePhoto?: boolean;

  @IsNotEmpty()
  @IsString()
  @IsIn(['once', 'daily', 'weekly'])
  recurrence: 'once' | 'daily' | 'weekly';
}
