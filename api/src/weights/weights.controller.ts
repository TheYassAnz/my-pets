import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WeightsService } from './weights.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from '../auth/jwt-auth.guard';

@Controller('animals/:animalId/weights')
@UseGuards(JwtAuthGuard)
export class WeightsController {
  constructor(private readonly weightsService: WeightsService) {}

  @Get()
  findByAnimal(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
  ) {
    return this.weightsService.findByAnimal(user.sub, animalId);
  }

  @Post()
  addWeight(
    @CurrentUser() user: JwtPayload,
    @Param('animalId') animalId: string,
    @Body() body: { weightKg: number; date?: string },
  ) {
    return this.weightsService.addWeight(user.sub, animalId, body.weightKg, body.date);
  }
}
