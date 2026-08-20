import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { EVENT_EMITTER } from 'src/common/event-emitter/event-emitter.provider';
import { logJson } from 'src/common/logging/log-event.util';
import { EmailService } from 'src/email/email.service';
import {
  FAMILY_GROUP_MEMBER_INVITED_EVENT,
  FamilyGroupMemberInvitedEvent,
} from 'src/family-group/events/family-group-member-invited.event';
import { UserCreatedEvent } from 'src/user/events/user-created.event';
import { NotificationService } from '../notification.service';
import { NOTIFICATION_CHANNELS } from '../types/notification-channel.type';
import { NOTIFICATION_TYPES } from '../types/notification-type.type';

const USER_CREATED_EVENT = 'user.created';

@Injectable()
export class NotificationEventsListener implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventsListener.name);

  constructor(
    @Inject(EVENT_EMITTER)
    private readonly eventEmitter: EventEmitter,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit(): void {
    this.eventEmitter.on(
      FAMILY_GROUP_MEMBER_INVITED_EVENT,
      async (payload: FamilyGroupMemberInvitedEvent) => {
        await this.handleFamilyGroupMemberInvited(payload);
      },
    );

    this.eventEmitter.on(
      USER_CREATED_EVENT,
      async (payload: UserCreatedEvent) => {
        await this.handleUserCreated(payload);
      },
    );
  }

  private async handleFamilyGroupMemberInvited(
    payload: FamilyGroupMemberInvitedEvent,
  ): Promise<void> {
    try {
      const hasAccount = Boolean(payload.recipientUserId);

      // Quem ainda não tem conta é levado ao cadastro com o e-mail preenchido;
      // o convite é vinculado sozinho no `user.created`.
      const actionUrl = hasAccount
        ? '/new-resources/family?tab=invitations'
        : `/register?email=${encodeURIComponent(payload.recipientEmail)}`;

      const body = hasAccount
        ? `Você foi convidado(a) para integrar o grupo "${payload.groupName}".`
        : `Você foi convidado(a) para integrar o grupo "${payload.groupName}" no Super Family Quest. Crie sua conta com este e-mail para aceitar o convite.`;

      // Convite vinculado no cadastro não manda e-mail: a pessoa acabou de
      // entrar no app e já recebeu o e-mail do convite original.
      const channels =
        payload.origin === 'signup_link'
          ? [NOTIFICATION_CHANNELS.IN_APP]
          : [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL];

      await this.notificationService.notify({
        userId: payload.recipientUserId,
        recipientEmail: payload.recipientEmail,
        recipientName: payload.recipientName,
        type: NOTIFICATION_TYPES.FAMILY_GROUP_INVITE,
        title: 'Convite para grupo familiar',
        body,
        actorName: payload.actorName,
        actionUrl,
        data: {
          groupId: payload.groupId,
          memberId: payload.memberId,
        },
        channels,
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

  /** Boas-vindas tem template próprio e não gera item no inbox do app. */
  private async handleUserCreated(payload: UserCreatedEvent): Promise<void> {
    try {
      await this.emailService.sendWelcome({
        to: payload.user.email,
        name: payload.user.name,
      });
    } catch (error) {
      logJson(this.logger, {
        event: 'notification_listener_failed',
        domain_event: USER_CREATED_EVENT,
        userId: payload.user?.id,
        error_message:
          error instanceof Error ? error.message : 'Unknown listener error',
      });
    }
  }
}
