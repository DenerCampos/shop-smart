import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { EVENT_EMITTER } from 'src/common/event-emitter/event-emitter.provider';
import { logJson } from 'src/common/logging/log-event.util';
import { MissionService } from './mission.service';

interface DomainEventPayload {
  userId: string;
}

@Injectable()
export class MissionEventsListener implements OnModuleInit {
  private readonly logger = new Logger(MissionEventsListener.name);

  constructor(
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
    private readonly missionService: MissionService,
  ) {}

  onModuleInit(): void {
    this.eventEmitter.on(
      'auth.login_success',
      async (payload: DomainEventPayload) => {
        await this.safeIncrement(payload.userId, 'daily_login');
      },
    );

    this.eventEmitter.on(
      'expense.created',
      async (payload: DomainEventPayload) => {
        await this.safeIncrement(payload.userId, 'daily_coupon');
      },
    );

    this.eventEmitter.on(
      'revenue.created',
      async (payload: DomainEventPayload) => {
        await this.safeIncrement(payload.userId, 'daily_revenue');
      },
    );

    this.eventEmitter.on(
      'shopping_list.created',
      async (payload: DomainEventPayload) => {
        await this.safeIncrement(payload.userId, 'monthly_shopping_list');
      },
    );

    this.eventEmitter.on(
      'recipe.created',
      async (payload: DomainEventPayload) => {
        await this.safeIncrement(payload.userId, 'once_first_recipe');
      },
    );

    this.eventEmitter.on(
      'chore.approved',
      async (payload: DomainEventPayload) => {
        await this.safeIncrement(payload.userId, 'monthly_chore_complete');
      },
    );
  }

  private async safeIncrement(userId: string, key: string): Promise<void> {
    try {
      await this.missionService.incrementProgress(userId, key);
    } catch (err) {
      logJson(this.logger, {
        event: 'mission_increment_failed',
        userId,
        missionKey: key,
        error_message:
          err instanceof Error
            ? err.message
            : 'Unknown mission increment error',
      });
    }
  }
}
