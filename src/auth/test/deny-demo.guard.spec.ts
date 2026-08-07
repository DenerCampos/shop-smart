import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DenyDemoGuard } from '../deny-demo.guard';
import * as logEventUtil from '../../common/logging/log-event.util';

describe('DenyDemoGuard', () => {
  const guard = new DenyDemoGuard();
  let logJsonSpy: jest.SpyInstance;

  beforeEach(() => {
    logJsonSpy = jest.spyOn(logEventUtil, 'logJson').mockImplementation();
  });

  afterEach(() => {
    logJsonSpy.mockRestore();
  });

  function mockContext(
    isDemo?: boolean,
    extras?: { userId?: string; path?: string; method?: string },
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          isDemo,
          user: extras?.userId ? { id: extras.userId } : undefined,
          method: extras?.method ?? 'PATCH',
          originalUrl: extras?.path ?? '/user/u1',
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('permite quando isDemo é false/undefined', () => {
    expect(guard.canActivate(mockContext(false))).toBe(true);
    expect(guard.canActivate(mockContext(undefined))).toBe(true);
    expect(logJsonSpy).not.toHaveBeenCalled();
  });

  it('bloqueia com ForbiddenException quando isDemo é true', () => {
    const context = mockContext(true, {
      userId: 'u-demo',
      path: '/user/u-demo',
      method: 'PATCH',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(/conta demo/i);
    expect(logJsonSpy).toHaveBeenCalledWith(
      expect.anything(),
      {
        event: 'demo_profile_mutation_denied',
        userId: 'u-demo',
        method: 'PATCH',
        path: '/user/u-demo',
      },
      'warn',
    );
  });
});
