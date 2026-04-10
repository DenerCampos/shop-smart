import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class OauthAuthorizeDto {
  @IsNotEmpty()
  @IsString()
  client_id: string;

  @IsNotEmpty()
  @IsString()
  response_type: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  redirect_uri: string;

  @IsOptional()
  @IsString()
  state?: string;
}
