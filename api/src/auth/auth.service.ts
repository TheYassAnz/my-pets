import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma.service';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type PublicUser = {
  id: string;
  email: string;
  createdAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string): Promise<AuthTokens & { user: PublicUser }> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const hash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: { email, password: hash },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async login(email: string, password: string): Promise<AuthTokens & { user: PublicUser }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expirée, reconnectez-vous');
    }

    // Rotation : l'ancien token est révoqué, un nouveau est émis
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.user.id, stored.user.email);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toPublicUser(user);
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessToken = await this.jwt.signAsync({ sub: userId, email });

    const refreshToken = randomBytes(48).toString('base64url');
    const ttlDays = Number(this.config.get('REFRESH_TOKEN_TTL_DAYS') ?? 30);
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  // Les refresh tokens sont opaques et stockés hashés : un dump de la table ne permet pas de les réutiliser
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublicUser(user: { id: string; email: string; createdAt: Date }): PublicUser {
    return { id: user.id, email: user.email, createdAt: user.createdAt };
  }
}
