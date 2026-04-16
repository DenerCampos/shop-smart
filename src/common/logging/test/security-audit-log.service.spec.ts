import { Logger } from '@nestjs/common';
import { SecurityAuditLogService } from '../security-audit-log.service';
import * as logEventUtil from '../log-event.util';

describe('SecurityAuditLogService', () => {
  let service: SecurityAuditLogService;
  let logJsonSpy: jest.SpyInstance;

  beforeEach(() => {
    logJsonSpy = jest.spyOn(logEventUtil, 'logJson').mockImplementation();
    service = new SecurityAuditLogService();
  });

  afterEach(() => {
    logJsonSpy.mockRestore();
  });

  it('authLoginFailed registra evento com email', () => {
    service.authLoginFailed('a@b.com');
    expect(logJsonSpy).toHaveBeenCalledWith(
      expect.any(Logger),
      {
        event: 'auth_login_failed',
        email: 'a@b.com',
        reason: 'invalid_credentials',
      },
      'warn',
    );
  });

  it('authRefreshFailed registra motivo invalid_refresh', () => {
    service.authRefreshFailed('u@x', 'invalid_refresh');
    expect(logJsonSpy).toHaveBeenCalledWith(
      expect.any(Logger),
      {
        event: 'auth_refresh_failed',
        email: 'u@x',
        reason: 'invalid_refresh',
      },
      'warn',
    );
  });

  it('authRefreshFailed registra motivo user_not_found', () => {
    service.authRefreshFailed('u@x', 'user_not_found');
    expect(logJsonSpy).toHaveBeenCalledWith(
      expect.any(Logger),
      expect.objectContaining({ reason: 'user_not_found' }),
      'warn',
    );
  });
});
