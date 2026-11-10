import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnimalsModule } from './animals/animals.module';
import { AuthModule } from './auth/auth.module';
import { ExportModule } from './export/export.module';
import { ExtractionModule } from './extraction/extraction.module';
import { HealthEventsModule } from './health-events/health-events.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaService } from './prisma.service';
import { WeightsModule } from './weights/weights.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    AnimalsModule,
    HealthEventsModule,
    WeightsModule,
    ExtractionModule,
    NotificationsModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
