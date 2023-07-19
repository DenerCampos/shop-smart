import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SignInDto } from './dto/signIn.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from './dto/refreshToken.dto';
import { jwtTokenType } from './types/jwtTokenType';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(signInDto: SignInDto): Promise<jwtTokenType> {
    const user = await this.usersService.findByEmail(signInDto.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    const isMatch = await bcrypt.compare(signInDto.password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    await this.usersService.saveToken(user.id, accessToken);

    return {
      accessToken,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<jwtTokenType> {
    const user = await this.usersService.findByEmail(refreshTokenDto.email);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.token !== refreshTokenDto.token) {
      throw new UnauthorizedException();
    }

    const payload = { sub: user.id, username: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    await this.usersService.saveToken(user.id, accessToken);

    return {
      accessToken,
    };
  }
}
