import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { FamilyGroupModule } from 'src/family-group/family-group.module';
import { CommonModule } from 'src/common/common.module';
import { OauthClient } from './entities/oauth-client.entity';
import { OauthCode } from './entities/oauth-code.entity';
import { OauthConnection } from './entities/oauth-connection.entity';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UserModule,
    FamilyGroupModule,
    CommonModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '10h' },
    }),
    TypeOrmModule.forFeature([OauthClient, OauthCode, OauthConnection]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
