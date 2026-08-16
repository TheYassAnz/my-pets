import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HealthEventsService } from './health-events.service';
import { UpcomingHealthEventsQueryDto } from './dto/upcoming-health-events-query.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';

// Non imbriqué sous /animals/:animalId — l'écran d'accueil a besoin des
// échéances toutes espèces confondues en un seul appel.
@Controller('health-events')
@UseGuards(JwtAuthGuard)
export class UpcomingHealthEventsController {
  constructor(private readonly healthEventsService: HealthEventsService) {}

  @Get('upcoming')
  findUpcoming(
    @CurrentUser() user: JwtPayload,
    @Query() query: UpcomingHealthEventsQueryDto,
  ) {
    return this.healthEventsService.findUpcoming(user.sub, query.days);
  }
}
