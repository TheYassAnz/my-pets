import {
  ValidationPipe,
  type CanActivate,
  type INestApplication,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const keys = { p256dh: 'pk', auth: 'ak' };
const fakeGuard: CanActivate = {
  canActivate: (ctx) => {
    ctx.switchToHttp().getRequest<{ user?: unknown }>().user = {
      sub: 'u1',
      email: 'a@b.fr',
    };
    return true;
  },
};

async function makeApp(realGuard = false) {
  const service = {
    saveSubscription: jest.fn().mockResolvedValue({ ok: true }),
    removeSubscription: jest.fn().mockResolvedValue(undefined),
  };
  let builder = Test.createTestingModule({
    controllers: [NotificationsController],
    providers: [
      { provide: NotificationsService, useValue: service },
      {
        provide: JwtService,
        useValue: { verifyAsync: jest.fn().mockRejectedValue(new Error('x')) },
      },
    ],
  });
  if (!realGuard) {
    builder = builder.overrideGuard(JwtAuthGuard).useValue(fakeGuard);
  }
  const app: INestApplication = (
    await builder.compile()
  ).createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return {
    app,
    service,
    server: app.getHttpServer() as Parameters<typeof request>[0],
  };
}

describe('NotificationsController (abonnements Web Push)', () => {
  let ctx: Awaited<ReturnType<typeof makeApp>>;
  beforeEach(async () => {
    ctx = await makeApp();
  });
  afterEach(() => ctx.app.close());

  it('enregistre un abonnement FCM', async () => {
    const endpoint = 'https://fcm.googleapis.com/fcm/send/abc';
    await request(ctx.server)
      .put('/notifications/subscription')
      .send({ endpoint, keys })
      .expect(200);
    expect(ctx.service.saveSubscription).toHaveBeenCalledWith('u1', {
      endpoint,
      ...keys,
    });
  });

  it.each([
    'https://updates.push.services.mozilla.com/wpush/v2/abc',
    'https://web.push.apple.com/abc',
    'https://wns2-par02p.notify.windows.com/w/?token=abc',
  ])('accepte %s', async (endpoint) => {
    await request(ctx.server)
      .put('/notifications/subscription')
      .send({ endpoint, keys })
      .expect(200);
  });

  it.each([
    'https://interne.exemple.fr/x',
    'http://fcm.googleapis.com/x',
    'https://fcm.googleapis.com.evil.fr/x',
    'https://evil.fr/?fcm.googleapis.com',
    'https://fcm.googleapis.com@evil.fr/x',
    'pas une url',
  ])('rejette %s', async (endpoint) => {
    await request(ctx.server)
      .put('/notifications/subscription')
      .send({ endpoint, keys })
      .expect(400);
    expect(ctx.service.saveSubscription).not.toHaveBeenCalled();
  });

  it('rejette des clés manquantes', async () => {
    const endpoint = 'https://fcm.googleapis.com/fcm/send/abc';
    for (const body of [
      { endpoint },
      { endpoint, keys: { p256dh: 'pk' } },
      { endpoint, keys: { auth: 'ak' } },
    ]) {
      await request(ctx.server)
        .put('/notifications/subscription')
        .send(body)
        .expect(400);
    }
    expect(ctx.service.saveSubscription).not.toHaveBeenCalled();
  });

  it('rejette un endpoint ou des clés trop longs', async () => {
    const endpoint = `https://fcm.googleapis.com/${'a'.repeat(3000)}`;
    await request(ctx.server)
      .put('/notifications/subscription')
      .send({ endpoint, keys })
      .expect(400);
    await request(ctx.server)
      .put('/notifications/subscription')
      .send({
        endpoint: 'https://fcm.googleapis.com/x',
        keys: { p256dh: 'p'.repeat(257), auth: 'a' },
      })
      .expect(400);
    await request(ctx.server)
      .delete('/notifications/subscription')
      .send({ endpoint })
      .expect(400);
    expect(ctx.service.saveSubscription).not.toHaveBeenCalled();
    expect(ctx.service.removeSubscription).not.toHaveBeenCalled();
  });

  it('supprime un abonnement (204)', async () => {
    await request(ctx.server)
      .delete('/notifications/subscription')
      .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc' })
      .expect(204);
    expect(ctx.service.removeSubscription).toHaveBeenCalledWith(
      'u1',
      'https://fcm.googleapis.com/fcm/send/abc',
    );
  });
});

describe('NotificationsController sans JWT', () => {
  it('renvoie 401 via le vrai JwtAuthGuard', async () => {
    const { app, service, server } = await makeApp(true);
    await request(server)
      .put('/notifications/subscription')
      .send({ endpoint: 'https://fcm.googleapis.com/x', keys })
      .expect(401);
    expect(service.saveSubscription).not.toHaveBeenCalled();
    await app.close();
  });
});
