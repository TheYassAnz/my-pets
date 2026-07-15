import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HealthEventsService } from './health-events.service';
import { CreateHealthEventDto } from './dto/create-health-event.dto';
import { UpdateHealthEventDto } from './dto/update-health-event.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';

@Controller('animals/:animalId/events')
@UseGuards(JwtAuthGuard)
export class HealthEventsController {
  constructor(private readonly healthEventsService: HealthEventsService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
  ) {
    return this.healthEventsService.findAll(user.sub, animalId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
    @Param('id') id: string,
  ) {
    return this.healthEventsService.findOne(user.sub, animalId, id);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
    @Body() dto: CreateHealthEventDto,
  ) {
    return this.healthEventsService.create(user.sub, animalId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
    @Param('id') id: string,
    @Body() dto: UpdateHealthEventDto,
  ) {
    return this.healthEventsService.update(user.sub, animalId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
    @Param('id') id: string,
  ) {
    await this.healthEventsService.remove(user.sub, animalId, id);
  }
}
