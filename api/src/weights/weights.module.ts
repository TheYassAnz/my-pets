import { Module } from '@nestjs/common';
import { WeightsService } from './weights.service';
import { WeightsController } from './weights.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [WeightsController],
  providers: [WeightsService, PrismaService],
  exports: [WeightsService],
})
export class WeightsModule {}
