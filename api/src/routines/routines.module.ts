import { Module } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { RoutinesController } from './routines.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [RoutinesController],
  providers: [RoutinesService, PrismaService],
  exports: [RoutinesService],
})
export class RoutinesModule {}
