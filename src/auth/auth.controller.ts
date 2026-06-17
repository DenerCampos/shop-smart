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
import { seconds, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { OauthAuthorizeDto } from './dto/oauth-authorize.dto';
import { OauthLoginDto } from './dto/oauth-login.dto';
import { OauthTokenDto } from './dto/oauth-token.dto';
import { DemoLoginDto } from './dto/demo-login.dto';
import { jwtTokenType } from './types/jwtTokenType';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Limite rigoroso: 5 tentativas/min para prevenir brute force
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  // Ligeiramente mais permissivo: refresh não expõe credenciais diretamente
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
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

  // Limite rigoroso: 5 tentativas/min para prevenir brute force via OAuth
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @HttpCode(HttpStatus.OK)
  @Post('oauth/login')
  async oauthLogin(
    @Body() dto: OauthLoginDto,
  ): Promise<{ redirectUrl: string }> {
    return this.authService.oauthLogin(dto);
  }

  // Troca de código por token: 10/min é seguro pois requer código único de uso único
  @Throttle({ default: { limit: 10, ttl: seconds(60) } })
  @HttpCode(HttpStatus.OK)
  @Post('oauth/token')
  async oauthToken(@Body() dto: OauthTokenDto) {
    return this.authService.oauthToken(dto);
  }

  @Throttle({ default: { limit: 3, ttl: seconds(60) } })
  @HttpCode(HttpStatus.OK)
  @Post('demo')
  async demoLogin(@Body() dto: DemoLoginDto): Promise<jwtTokenType> {
    return this.authService.demoLogin(dto.key);
  }
}
