import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OauthTokenDto {
  @IsNotEmpty()
  @IsString()
  grant_type: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  refresh_token?: string;

  @IsNotEmpty()
  @IsString()
  client_id: string;

  @IsNotEmpty()
  @IsString()
  client_secret: string;

  @IsOptional()
  @IsString()
  redirect_uri?: string;
}
