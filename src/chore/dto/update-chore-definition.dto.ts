import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateChoreDefinitionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rewardValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coinReward?: number;

  @IsOptional()
  @IsBoolean()
  requirePhoto?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['once', 'daily', 'weekly'])
  recurrence?: 'once' | 'daily' | 'weekly';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
