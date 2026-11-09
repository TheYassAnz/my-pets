import { NestExpressApplication } from '@nestjs/platform-express';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import request from 'supertest';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

const dir = mkdtempSync(join(tmpdir(), 'client-'));
writeFileSync(join(dir, 'index.html'), '<p>shell</p>');
writeFileSync(join(dir, 'sw.js'), 'self.skipWaiting();');
// Doit précéder l'import d'AppModule (rootPath lu à la définition du module).
process.env.CLIENT_DIR = dir;
process.env.RESEND_API_KEY ??= 're_test';
process.env.EMAIL_FROM ??= 'test@example.com';
process.env.DATABASE_URL ??= 'postgresql://x:x@localhost:1/x';
process.env.JWT_ACCESS_SECRET ??= 'test-secret';
process.env.SUPABASE_URL ??= 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-key';

describe('PWA statique', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { NestFactory } =
      require('@nestjs/core') as typeof import('@nestjs/core');
    const { AppModule } =
      require('./app.module') as typeof import('./app.module');
    const { PrismaService } =
      require('./prisma.service') as typeof import('./prisma.service');
    /* eslint-enable @typescript-eslint/no-require-imports */
    // Jamais de connexion à la base : on neutralise le $connect d'onModuleInit.
    jest
      .spyOn(PrismaService.prototype, 'onModuleInit')
      .mockResolvedValue(undefined);
    // NestFactory (pas Test) : ServeStaticModule exige l'adaptateur HTTP dès la compilation.
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: false,
    });
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(() => app.close());

  it('GET / sert le shell', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.text).toContain('shell');
  });

  it('GET /animals/123 retombe sur index.html', async () => {
    const res = await request(app.getHttpServer())
      .get('/animals/123')
      .expect(200);
    expect(res.text).toContain('shell');
  });

  it('GET /sw.js est du JavaScript non mis en cache', async () => {
    const res = await request(app.getHttpServer()).get('/sw.js').expect(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('GET /index.html est non mis en cache', async () => {
    const res = await request(app.getHttpServer())
      .get('/index.html')
      .expect(200);
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('GET /api/inconnu renvoie un 404 JSON sans shell', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/inconnu')
      .expect(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.text).not.toContain('shell');
  });

  it('GET /api/auth/me sans jeton renvoie 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });
});
