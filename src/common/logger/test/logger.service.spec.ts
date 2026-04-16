import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppLoggerService } from '../logger.service';

describe('AppLoggerService', () => {
  let service: AppLoggerService;
  let winston: {
    info: jest.Mock;
    error: jest.Mock;
    warn: jest.Mock;
    debug: jest.Mock;
    verbose: jest.Mock;
  };

  beforeEach(async () => {
    winston = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLoggerService,
        { provide: WINSTON_MODULE_PROVIDER, useValue: winston },
      ],
    }).compile();

    service = module.get(AppLoggerService);
  });

  it('log delega ao winston.info com contexto', () => {
    service.log('msg', 'Ctx');
    expect(winston.info).toHaveBeenCalledWith('msg', { context: 'Ctx' });
  });

  it('error delega ao winston.error', () => {
    service.error('e', 'stack', 'C');
    expect(winston.error).toHaveBeenCalledWith('e', {
      trace: 'stack',
      context: 'C',
    });
  });

  it('warn, debug e verbose delegam aos níveis correspondentes', () => {
    service.warn('w', 'W');
    service.debug('d', 'D');
    service.verbose('v', 'V');
    expect(winston.warn).toHaveBeenCalledWith('w', { context: 'W' });
    expect(winston.debug).toHaveBeenCalledWith('d', { context: 'D' });
    expect(winston.verbose).toHaveBeenCalledWith('v', { context: 'V' });
  });
});
