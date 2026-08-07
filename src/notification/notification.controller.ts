import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ResponseService } from 'src/common/response/response';
import { User } from 'src/user/entities/user.entity';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { MarkNotificationsReadDto } from './dto/mark-notifications-read.dto';
import { MarkNotificationsReadResponseDto } from './dto/mark-notifications-read-response.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationUnreadCountResponseDto } from './dto/notification-unread-count-response.dto';
import { NotificationService } from './notification.service';

@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: User,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationResponseDto[]> {
    const items = await this.notificationService.listForUser(
      user.id,
      query.limit ?? 20,
    );

    return this.responseService.mapArrayToDto(NotificationResponseDto, items);
  }

  @Get('unread-count')
  async unreadCount(
    @CurrentUser() user: User,
  ): Promise<NotificationUnreadCountResponseDto> {
    const count = await this.notificationService.unreadCount(user.id);

    return this.responseService.mapToDto(NotificationUnreadCountResponseDto, {
      count,
    });
  }

  @Patch('read')
  async markAsRead(
    @CurrentUser() user: User,
    @Body() body: MarkNotificationsReadDto,
  ): Promise<MarkNotificationsReadResponseDto> {
    const updated = await this.notificationService.markAsRead(
      user.id,
      body.ids,
    );

    return this.responseService.mapToDto(MarkNotificationsReadResponseDto, {
      updated,
    });
  }
}
