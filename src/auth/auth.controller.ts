import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Redirect,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { OauthAuthorizeDto } from './dto/oauth-authorize.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { OauthTokenDto } from './dto/oauth-token.dto';
import { jwtTokenType } from './types/jwtTokenType';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Put('refresh')
  async refreshToken(@Body() token: RefreshTokenDto): Promise<jwtTokenType> {
    return this.authService.refreshToken(token);
  }

  @Get('oauth/authorize')
  @Redirect()
  async oauthAuthorize(@Query() dto: OauthAuthorizeDto) {
    const url = await this.authService.oauthAuthorize(dto);
    return { url, statusCode: HttpStatus.FOUND };
  }

  @HttpCode(HttpStatus.OK)
  @Post('oauth/login')
  async oauthLogin(
    @Body() dto: OauthLoginDto,
  ): Promise<{ redirectUrl: string }> {
    return this.authService.oauthLogin(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('oauth/token')
  async oauthToken(@Body() dto: OauthTokenDto) {
    return this.authService.oauthToken(dto);
  }
}
