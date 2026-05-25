import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { logJson } from 'src/common/logging/log-event.util';
import { MissionService } from './mission.service';

const MISSION_CRON_TIMEZONE = 'America/Sao_Paulo';

@Injectable()
export class MissionSchedulerService {
  private readonly logger = new Logger(MissionSchedulerService.name);

  constructor(private readonly missionService: MissionService) {}

  /** Runs at midnight every day — resets all DAILY missions */
  @Cron('0 0 * * *', { timeZone: MISSION_CRON_TIMEZONE })
  async resetDailyMissions(): Promise<void> {
    try {
      await this.missionService.resetDailyMissions();
    } catch (err) {
      logJson(this.logger, {
        event: 'mission_daily_reset_failed',
        error_message:
          err instanceof Error ? err.message : 'Unknown daily reset error',
      });
    }
  }

  /** Runs at midnight on the 1st of every month — resets all MONTHLY missions */
  @Cron('0 0 1 * *', { timeZone: MISSION_CRON_TIMEZONE })
  async resetMonthlyMissions(): Promise<void> {
    try {
      await this.missionService.resetMonthlyMissions();
    } catch (err) {
      logJson(this.logger, {
        event: 'mission_monthly_reset_failed',
        error_message:
          err instanceof Error ? err.message : 'Unknown monthly reset error',
      });
    }
  }
}
