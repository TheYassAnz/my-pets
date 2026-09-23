import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { HouseholdService } from './household.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';

@Controller('household')
@UseGuards(JwtAuthGuard)
export class HouseholdController {
  constructor(private readonly householdService: HouseholdService) {}

  @Get('members')
  getMembers(@CurrentUser() user: JwtPayload) {
    return this.householdService.getMembers(user.sub);
  }

  @Post('members')
  addMember(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name: string; role?: string },
  ) {
    return this.householdService.addMember(user.sub, body.name, body.role);
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.householdService.getStats(user.sub);
  }
}
