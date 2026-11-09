import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ServerResponse } from 'http';
import { join } from 'path';
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
    ServeStaticModule.forRoot({
      rootPath: process.env.CLIENT_DIR ?? join(__dirname, '..', 'client'),
      exclude: ['/api/{*path}'],
      serveStaticOptions: {
        // Fichiers non hachés : toujours revalider (les /_expo/static/* hachés gardent le cache par défaut).
        setHeaders: (res: ServerResponse, path: string) => {
          if (/[\\/](index\.html|sw\.js|manifest\.json)$/.test(path)) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      },
    }),
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
