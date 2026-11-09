import type { Request, Response } from 'express';

export const REFRESH_COOKIE = 'mypets_rt';

const options = () => ({
  httpOnly: true,
  sameSite: 'strict' as const,
  // Littéral : le préfixe global `api` n'est pas visible dans les tests de contrôleur.
  path: '/api/auth',
  secure: process.env.NODE_ENV === 'production',
});

export function setRefreshCookie(
  res: Response,
  token: string,
  ttlDays: number,
): void {
  res.cookie(REFRESH_COOKIE, token, {
    ...options(),
    maxAge: ttlDays * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.cookie(REFRESH_COOKIE, '', { ...options(), maxAge: 0 });
}

export function readRefreshCookie(req: Request): string | undefined {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === REFRESH_COOKIE) {
      return decodeURIComponent(value.join('=')) || undefined;
    }
  }
  return undefined;
}
