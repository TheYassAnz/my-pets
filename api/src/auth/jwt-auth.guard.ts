import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type JwtPayload = {
  sub: string;
  email: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      (request as Request & { user: JwtPayload }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
