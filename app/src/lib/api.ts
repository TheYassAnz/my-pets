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

export type Animal = {
  id: string;
  name: string;
  species: string;
  birthDate: string | null;
  photoUrl: string | null;
  createdAt: string;
};

export type AnimalInput = {
  name: string;
  species: string;
  birthDate?: string;
};

export type HealthEventType = 'VACCINE' | 'TREATMENT' | 'VISIT';

export type HealthEvent = {
  id: string;
  type: HealthEventType;
  title: string;
  date: string;
  dosage: string | null;
  vet: string | null;
  notes: string | null;
  nextDueDate: string | null;
  animalId: string;
  createdAt: string;
};

export type HealthEventInput = {
  type: HealthEventType;
  title: string;
  date: string;
  dosage?: string;
  vet?: string;
  notes?: string;
  nextDueDate?: string;
};

async function uploadFile<T>(
  path: string,
  file: { uri: string; name: string; type: string },
  retryOn401 = true,
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(0, 'EXPO_PUBLIC_API_URL non configurée');
  }

  const accessToken = await getToken(ACCESS_TOKEN_KEY);
  const form = new FormData();
  // @ts-expect-error React Native accepte {uri, name, type} comme valeur de FormData
  form.append('photo', { uri: file.uri, name: file.name, type: file.type });

  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: form,
  });

  if (response.status === 401 && retryOn401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return uploadFile<T>(path, file, false);
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

  return (await response.json()) as T;
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

  forgotPassword: (email: string) =>
    request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    }),

  listAnimals: () => request<Animal[]>('/animals'),

  getAnimal: (id: string) => request<Animal>(`/animals/${id}`),

  createAnimal: (input: AnimalInput) =>
    request<Animal>('/animals', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateAnimal: (id: string, input: Partial<AnimalInput>) =>
    request<Animal>(`/animals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  deleteAnimal: (id: string) =>
    request<void>(`/animals/${id}`, { method: 'DELETE' }),

  uploadAnimalPhoto: (id: string, file: { uri: string; name: string; type: string }) =>
    uploadFile<Animal>(`/animals/${id}/photo`, file),

  listEvents: (animalId: string) =>
    request<HealthEvent[]>(`/animals/${animalId}/events`),

  getEvent: (animalId: string, id: string) =>
    request<HealthEvent>(`/animals/${animalId}/events/${id}`),

  createEvent: (animalId: string, input: HealthEventInput) =>
    request<HealthEvent>(`/animals/${animalId}/events`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateEvent: (animalId: string, id: string, input: Partial<HealthEventInput>) =>
    request<HealthEvent>(`/animals/${animalId}/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  deleteEvent: (animalId: string, id: string) =>
    request<void>(`/animals/${animalId}/events/${id}`, { method: 'DELETE' }),
};
