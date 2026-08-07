import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../auth.guard';
import { UserService } from '../../user/user.service';
import { User } from '../../user/entities/user.entity';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let userService: jest.Mocked<Pick<UserService, 'find'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'verifyAsync'>>;

  beforeEach(() => {
    userService = { find: jest.fn() };
    jwtService = { verifyAsync: jest.fn() };
    guard = new AuthGuard(
      userService as unknown as UserService,
      jwtService as unknown as JwtService,
    );
  });

  function mockContext(authorization?: string) {
    const request: Record<string, unknown> = {
      headers: { authorization },
    };
    return {
      request,
      context: {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      },
    };
  }

  it('propaga isDemo=true a partir do payload JWT', async () => {
    const user = { id: 'u1' } as User;
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'u1',
      username: 'demo@test.local',
      isDemo: true,
    });
    userService.find.mockResolvedValue(user);

    const { request, context } = mockContext('Bearer demo-token');
    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect(request.user).toBe(user);
    expect(request.isDemo).toBe(true);
  });

  it('propaga isDemo=false quando flag ausente no payload', async () => {
    const user = { id: 'u1' } as User;
    jwtService.verifyAsync.mockResolvedValue({
      sub: 'u1',
      username: 'user@test.local',
    });
    userService.find.mockResolvedValue(user);

    const { request, context } = mockContext('Bearer normal-token');
    await expect(guard.canActivate(context as never)).resolves.toBe(true);
    expect(request.isDemo).toBe(false);
  });

  it('lança UnauthorizedException sem token', async () => {
    const { context } = mockContext(undefined);
    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
