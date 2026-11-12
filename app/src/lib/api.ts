import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type User = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthResponse = {
  accessToken: string;
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

// L'access token vit en mémoire seulement ; le refresh token est un cookie httpOnly
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// 'denied' : le serveur a refusé le cookie (session perdue) ;
// 'unreachable' : API endormie/coupée, on ne sait pas si la session est valide.
export type RefreshOutcome = 'ok' | 'denied' | 'unreachable';

// Marge au-dessus du réveil de Render (~1 min) pour ne pas couper un démarrage à froid
export const REFRESH_TIMEOUT_MS = 90_000;

// AbortSignal.timeout manque avant Safari 16.4 / Chrome 103 : sans signal, pas de plafond mais le refresh part
const timeoutSignal = () =>
  typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(REFRESH_TIMEOUT_MS) : undefined;

let refreshing: Promise<RefreshOutcome> | null = null;

// Vol unique dans l'onglet (promesse partagée) et entre onglets (Web Locks :
// le suivant rafraîchit avec le cookie déjà tourné).
export function refreshOutcome(): Promise<RefreshOutcome> {
  refreshing ??= (async () => {
    const run = async (): Promise<RefreshOutcome> => {
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          signal: timeoutSignal(),
        });
        if (response.ok) {
          const body = (await response.json()) as { accessToken: string };
          accessToken = body.accessToken;
          return 'ok';
        }
        accessToken = null;
        return response.status >= 500 ? 'unreachable' : 'denied';
      } catch {
        // réseau coupé ou délai dépassé
        accessToken = null;
        return 'unreachable';
      }
    };
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!locks) return run();
    // Le plafond couvre aussi l'attente du verrou (onglet gelé qui le détient)
    return locks.request('mypets-refresh', { signal: timeoutSignal() }, run).catch(() => {
      accessToken = null;
      return 'unreachable' as const;
    });
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function refreshSession(): Promise<boolean> {
  return (await refreshOutcome()) === 'ok';
}

// Les routes /auth/* gèrent elles-mêmes leurs 401 (identifiants invalides)
async function send(
  path: string,
  init: RequestInit,
  retryOn401: boolean,
): Promise<Response> {
  if (!API_URL) {
    throw new ApiError(0, 'EXPO_PUBLIC_API_URL non configurée');
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
  if (response.status === 401 && retryOn401 && !path.startsWith('/auth/')) {
    if (await refreshSession()) {
      return send(path, init, false);
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
  return response;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await send(
    path,
    {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    },
    true,
  );
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export type Animal = {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
  isSterilized?: boolean;
  dailyRation?: string | null;
  foodBrand?: string | null;
  foodStockKg?: number | null;
  foodTotalKg?: number | null;
  foodOpenedAt?: string | null;
  birthDate: string | null;
  photoUrl: string | null;
  latestWeight?: number | null;
  createdAt: string;
};

export type WeightRecord = {
  id: string;
  weightKg: number;
  date: string;
  animalId: string;
};

// GET /animals renvoie chaque animal enrichi — jamais GET /animals/:id,
// une requête à la fois n'a pas besoin de ce résumé.
export type AnimalWithUpcoming = Animal & {
  nextDueDate: string | null;
  eventCount: number;
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

// GET /health-events/upcoming — toutes espèces confondues, pour l'écran
// d'accueil. Un sous-ensemble aplati de HealthEvent (nom de l'animal
// inclus, nextDueDate garanti non nul puisque c'est le critère de tri).
export type UpcomingHealthEvent = {
  id: string;
  type: HealthEventType;
  title: string;
  date: string;
  nextDueDate: string | null;
  // Date affichée : la date d'un événement planifié, sinon sa prochaine échéance.
  dueDate: string;
  animalId: string;
  animalName: string;
};

// Résultat brut de l'extraction IA : tout champ illisible reste null,
// l'utilisateur complète et valide toujours avant sauvegarde
export type ExtractedHealthEvent = {
  type: HealthEventType | null;
  title: string | null;
  date: string | null;
  dosage: string | null;
  vet: string | null;
  notes: string | null;
  nextDueDate: string | null;
};

export type HealthEventInput = {
  type: HealthEventType;
  title: string;
  date: string;
  dosage?: string | null;
  vet?: string | null;
  notes?: string | null;
  nextDueDate?: string | null;
};

async function uploadFile<T>(
  path: string,
  field: string,
  file: { uri: string; name: string; type: string },
): Promise<T> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    // Le navigateur n'accepte que des Blob : l'URI du sélecteur de fichiers est un blob:/data: URL.
    const blob = await (await fetch(file.uri)).blob();
    form.append(field, new File([blob], file.name, { type: file.type }));
  } else {
    // @ts-expect-error React Native accepte {uri, name, type} comme valeur de FormData
    form.append(field, { uri: file.uri, name: file.name, type: file.type });
  }
  const response = await send(path, { method: 'POST', body: form }, true);
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
    // Le cookie refresh est httpOnly : si l'API échoue, la session reste ouverte
    await request<void>('/auth/logout', { method: 'POST' });
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

  listAnimals: () => request<AnimalWithUpcoming[]>('/animals'),

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
    uploadFile<Animal>(`/animals/${id}/photo`, 'photo', file),

  extractEvent: (animalId: string, file: { uri: string; name: string; type: string }) =>
    uploadFile<ExtractedHealthEvent>(
      `/animals/${animalId}/extractions`,
      'image',
      file,
    ),

  savePushSubscription: (sub: PushSubscriptionJSON) =>
    request<void>('/notifications/subscription', {
      method: 'PUT',
      body: JSON.stringify(sub),
    }),

  removePushSubscription: (endpoint: string) =>
    request<void>('/notifications/subscription', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    }),

  getReminderSettings: () =>
    request<{ leadDays: number[] }>('/notifications/settings'),

  updateReminderSettings: (leadDays: number[]) =>
    request<{ leadDays: number[] }>('/notifications/settings', {
      method: 'PATCH',
      body: JSON.stringify({ leadDays }),
    }),

  listUpcomingEvents: (days = 90) =>
    request<UpcomingHealthEvent[]>(`/health-events/upcoming?days=${days}`),

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

  downloadHealthRecord: async (animalId: string) =>
    (await send(`/animals/${animalId}/export`, {}, true)).blob(),

  listWeights: (animalId: string) =>
    request<WeightRecord[]>(`/animals/${animalId}/weights`),

  addWeight: (animalId: string, weightKg: number, date?: string) =>
    request<WeightRecord>(`/animals/${animalId}/weights`, {
      method: 'POST',
      body: JSON.stringify({ weightKg, date }),
    }),
};
