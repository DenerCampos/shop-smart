import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { EVENT_EMITTER } from 'src/common/event-emitter/event-emitter.provider';
import { logJson } from 'src/common/logging/log-event.util';
import {
  FAMILY_GROUP_MEMBER_INVITED_EVENT,
  FamilyGroupMemberInvitedEvent,
} from 'src/family-group/events/family-group-member-invited.event';
import { NotificationService } from '../notification.service';
import { NOTIFICATION_TYPES } from '../types/notification-type.type';

@Injectable()
export class NotificationEventsListener implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventsListener.name);

  constructor(
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit(): void {
    this.eventEmitter.on(
      FAMILY_GROUP_MEMBER_INVITED_EVENT,
      async (payload: FamilyGroupMemberInvitedEvent) => {
        await this.handleFamilyGroupMemberInvited(payload);
      },
    );
  }

  private async handleFamilyGroupMemberInvited(
    payload: FamilyGroupMemberInvitedEvent,
  ): Promise<void> {
    try {
      await this.notificationService.notify({
        userId: payload.recipientUserId,
        type: NOTIFICATION_TYPES.FAMILY_GROUP_INVITE,
        title: 'Convite para grupo familiar',
        body: `Você foi convidado(a) para integrar o grupo "${payload.groupName}".`,
        actorName: payload.actorName,
        actionUrl: '/new-resources/family?tab=invitations',
        data: {
          groupId: payload.groupId,
          memberId: payload.memberId,
        },
      });
    } catch (error) {
      logJson(this.logger, {
        event: 'notification_listener_failed',
        domain_event: FAMILY_GROUP_MEMBER_INVITED_EVENT,
        recipientUserId: payload.recipientUserId,
        memberId: payload.memberId,
        error_message:
          error instanceof Error ? error.message : 'Unknown listener error',
      });
    }
  }
}
