import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';

@Controller('routines')
@UseGuards(JwtAuthGuard)
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Get('today')
  getTodayTasks(@CurrentUser() user: JwtPayload) {
    return this.routinesService.getTodayTasks(user.sub);
  }

  @Post(':id/toggle')
  toggleTask(
    @CurrentUser() user: JwtPayload,
    @Param('id') routineId: string,
    @Body() body?: { userName?: string },
  ) {
    return this.routinesService.toggleTask(user.sub, routineId, body?.userName);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.routinesService.findAll(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { title: string; description?: string; frequency: string; animalId: string },
  ) {
    return this.routinesService.create(user.sub, dto);
  }
}
