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
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { UpdateReminderSettingsDto } from './dto/update-reminder-settings.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Put('token')
  registerToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.notificationsService.registerToken(user.sub, dto.token);
  }

  @Delete('token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeToken(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterPushTokenDto,
  ) {
    await this.notificationsService.removeToken(user.sub, dto.token);
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
