import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  PushSubscriptionDto,
  RemoveSubscriptionDto,
} from './dto/push-subscription.dto';
import { UpdateReminderSettingsDto } from './dto/update-reminder-settings.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Put('subscription')
  saveSubscription(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PushSubscriptionDto,
  ) {
    return this.notificationsService.saveSubscription(user.sub, {
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
    });
  }

  @Delete('subscription')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeSubscription(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RemoveSubscriptionDto,
  ) {
    await this.notificationsService.removeSubscription(user.sub, dto.endpoint);
  }

  @Get('settings')
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getSettings(user.sub);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateReminderSettingsDto,
  ) {
    return this.notificationsService.updateSettings(user.sub, dto.leadDays);
  }
}
