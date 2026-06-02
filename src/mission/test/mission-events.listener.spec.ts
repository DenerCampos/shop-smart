import { EventEmitter } from 'events';
import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_EMITTER } from 'src/common/event-emitter/event-emitter.provider';
import { MissionEventsListener } from '../mission-events.listener';
import { MissionService } from '../mission.service';

describe('MissionEventsListener', () => {
  let eventEmitter: EventEmitter;
  let missionService: jest.Mocked<
    Pick<MissionService, 'incrementProgress' | 'setFinancialHealthProgress'>
  >;

  beforeEach(async () => {
    eventEmitter = new EventEmitter();
    missionService = {
      incrementProgress: jest.fn().mockResolvedValue(undefined),
      setFinancialHealthProgress: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MissionEventsListener,
        { provide: EVENT_EMITTER, useValue: eventEmitter },
        { provide: MissionService, useValue: missionService },
      ],
    }).compile();

    module.get(MissionEventsListener).onModuleInit();
  });

  const emit = (event: string, userId = 'user-1') =>
    eventEmitter.emit(event, { userId });

  it('expense.created incrementa daily_coupon e atualiza saúde financeira', async () => {
    emit('expense.created');

    await new Promise((resolve) => setImmediate(resolve));

    expect(missionService.incrementProgress).toHaveBeenCalledWith(
      'user-1',
      'daily_coupon',
    );
    expect(missionService.setFinancialHealthProgress).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('revenue.created incrementa daily_revenue e atualiza saúde financeira', async () => {
    emit('revenue.created');

    await new Promise((resolve) => setImmediate(resolve));

    expect(missionService.incrementProgress).toHaveBeenCalledWith(
      'user-1',
      'daily_revenue',
    );
    expect(missionService.setFinancialHealthProgress).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('coupon.processed não incrementa daily_coupon', async () => {
    emit('coupon.processed');

    await new Promise((resolve) => setImmediate(resolve));

    expect(missionService.incrementProgress).not.toHaveBeenCalledWith(
      'user-1',
      'daily_coupon',
    );
  });

  it('auth.login_success incrementa daily_login', async () => {
    emit('auth.login_success');

    await new Promise((resolve) => setImmediate(resolve));

    expect(missionService.incrementProgress).toHaveBeenCalledWith(
      'user-1',
      'daily_login',
    );
  });
});
