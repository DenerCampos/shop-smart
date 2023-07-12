import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/signIn.dto';
import { RefreshTokenDto } from './dto/refreshToken.dto';
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
}
