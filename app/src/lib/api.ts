import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  deleteToken,
  getToken,
  setToken,
} from './token-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retryOn401 = true,
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, 'EXPO_PUBLIC_API_URL non configurée');
  }

  const accessToken = await getToken(ACCESS_TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && retryOn401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request<T>(path, options, false);
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? `Erreur ${response.status}`);
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = await getToken(REFRESH_TOKEN_KEY);
  if (!refreshToken || !API_URL) {
    return false;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await clearTokens();
    return false;
  }

  const tokens = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  await storeTokens(tokens.accessToken, tokens.refreshToken);
  return true;
}

export async function storeTokens(accessToken: string, refreshToken: string) {
  await setToken(ACCESS_TOKEN_KEY, accessToken);
  await setToken(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens() {
  await deleteToken(ACCESS_TOKEN_KEY);
  await deleteToken(REFRESH_TOKEN_KEY);
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: async () => {
    const refreshToken = await getToken(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      await request<void>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {
        // Le logout local doit réussir même si l'API est injoignable
      });
    }
    await clearTokens();
  },

  me: () => request<User>('/auth/me'),
};
