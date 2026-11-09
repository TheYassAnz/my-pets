import { UnauthorizedException, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const user = { id: 'u1', email: 'a@b.fr' };

describe('AuthController (cookie)', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];
  const service = {
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };
  const creds = { email: 'a@b.fr', password: 'motdepasse1' };

  beforeEach(async () => {
    jest.resetAllMocks();
    const mod = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: service },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = mod.createNestApplication();
    await app.init();
    server = app.getHttpServer() as typeof server;
  });

  afterEach(async () => {
    await app.close();
    process.env.NODE_ENV = 'test';
  });

  it('login : accessToken dans le corps, refresh token uniquement en cookie', async () => {
    service.login.mockResolvedValue({
      accessToken: 'a1',
      refreshToken: 'r1',
      user,
    });
    const res = await request(server)
      .post('/auth/login')
      .send(creds)
      .expect(200);
    expect(res.body).toEqual({ accessToken: 'a1', user });
    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^mypets_rt=r1;/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api\/auth/);
    expect(cookie).toMatch(/Max-Age=2592000/);
  });

  it('register : même contrat que login (201)', async () => {
    service.register.mockResolvedValue({
      accessToken: 'a1',
      refreshToken: 'r1',
      user,
    });
    const res = await request(server)
      .post('/auth/register')
      .send(creds)
      .expect(201);
    expect(res.body).toEqual({ accessToken: 'a1', user });
    expect(res.headers['set-cookie'][0]).toMatch(/^mypets_rt=r1;.*HttpOnly/);
  });

  it('refresh sans cookie → 401, service non appelé', async () => {
    await request(server).post('/auth/refresh').expect(401);
    expect(service.refresh).not.toHaveBeenCalled();
  });

  it('refresh avec cookie mypets_rt=old → nouveau cookie, corps {accessToken}', async () => {
    service.refresh.mockResolvedValue({
      accessToken: 'a2',
      refreshToken: 'new',
    });
    const res = await request(server)
      .post('/auth/refresh')
      .set('Cookie', 'other=x; mypets_rt=old')
      .expect(200);
    expect(service.refresh).toHaveBeenCalledWith('old');
    expect(res.body).toEqual({ accessToken: 'a2' });
    expect(res.headers['set-cookie'][0]).toMatch(/^mypets_rt=new;/);
  });

  it('refresh rejeté par le service → 401 et cookie effacé', async () => {
    service.refresh.mockRejectedValue(new UnauthorizedException());
    const res = await request(server)
      .post('/auth/refresh')
      .set('Cookie', 'mypets_rt=old')
      .expect(401);
    expect(res.headers['set-cookie'][0]).toMatch(/^mypets_rt=;.*Max-Age=0/);
  });

  it('logout avec cookie → 204, service.logout("old"), cookie effacé', async () => {
    const res = await request(server)
      .post('/auth/logout')
      .set('Cookie', 'mypets_rt=old')
      .expect(204);
    expect(service.logout).toHaveBeenCalledWith('old');
    expect(res.headers['set-cookie'][0]).toMatch(/^mypets_rt=;.*Max-Age=0/);
  });

  it('logout sans cookie → 204, service non appelé', async () => {
    await request(server).post('/auth/logout').expect(204);
    expect(service.logout).not.toHaveBeenCalled();
  });

  it('cookie Secure présent si NODE_ENV=production, absent sinon', async () => {
    service.login.mockResolvedValue({
      accessToken: 'a1',
      refreshToken: 'r1',
      user,
    });
    let res = await request(server).post('/auth/login').send(creds);
    expect(res.headers['set-cookie'][0]).not.toMatch(/Secure/);
    process.env.NODE_ENV = 'production';
    res = await request(server).post('/auth/login').send(creds);
    expect(res.headers['set-cookie'][0]).toMatch(/Secure/);
  });
});
