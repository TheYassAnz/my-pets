type ApiModule = typeof import('@/lib/api');

const json = (status: number, body?: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Response;

let mod: ApiModule;
let fetchMock: jest.Mock;

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'http://api.test/api';
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- reset des variables de module
  mod = require('@/lib/api');
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  delete (navigator as { locks?: unknown }).locks;
});

const headersOf = (call: unknown[]) =>
  ((call[1] as RequestInit).headers ?? {}) as Record<string, string>;

describe('session par cookie', () => {
  it('envoie credentials include et le Bearer mémoire, sans en-tête sans token', async () => {
    fetchMock.mockResolvedValue(json(200, []));
    await mod.api.listAnimals();
    expect((fetchMock.mock.calls[0][1] as RequestInit).credentials).toBe('include');
    expect(headersOf(fetchMock.mock.calls[0]).Authorization).toBeUndefined();

    mod.setAccessToken('tok');
    await mod.api.listAnimals();
    expect(headersOf(fetchMock.mock.calls[1]).Authorization).toBe('Bearer tok');
  });

  it('deux 401 simultanés ne déclenchent qu’un seul refresh puis sont rejoués', async () => {
    mod.setAccessToken('old');
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return json(200, { accessToken: 'new' });
      const auth = (init.headers as Record<string, string>).Authorization;
      return auth === 'Bearer new' ? json(200, []) : json(401, {});
    });

    await expect(Promise.all([mod.api.listAnimals(), mod.api.listAnimals()])).resolves.toEqual([
      [],
      [],
    ]);
    const refreshes = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/auth/refresh'));
    expect(refreshes).toHaveLength(1);
    expect((refreshes[0][1] as RequestInit).method).toBe('POST');
  });

  it('refresh en échec : ApiError 401 et token mémoire effacé', async () => {
    mod.setAccessToken('old');
    fetchMock.mockImplementation(async (url: string) =>
      json(401, { message: 'expired' }),
    );
    await expect(mod.api.listAnimals()).rejects.toMatchObject({ status: 401 });
    expect(mod.getAccessToken()).toBeNull();
  });

  it('une requête rejouée qui reprend 401 ne relance pas de refresh', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      String(url).endsWith('/auth/refresh') ? json(200, { accessToken: 'new' }) : json(401, {}),
    );
    await expect(mod.api.listAnimals()).rejects.toMatchObject({ status: 401 });
    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/auth/refresh'))).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('refreshSession passe par navigator.locks quand il existe, et fonctionne sans', async () => {
    fetchMock.mockResolvedValue(json(200, { accessToken: 'a' }));
    await expect(mod.refreshSession()).resolves.toBe(true);

    const request = jest.fn((_name: string, _options: unknown, cb: () => Promise<unknown>) => cb());
    Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true });
    await expect(mod.refreshSession()).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith(
      'mypets-refresh',
      { signal: expect.any(AbortSignal) },
      expect.any(Function),
    );
  });

  it("refreshOutcome renvoie 'ok' et mémorise le token sur 200", async () => {
    fetchMock.mockResolvedValue(json(200, { accessToken: 'new' }));
    expect(await mod.refreshOutcome()).toBe('ok');
    expect(mod.getAccessToken()).toBe('new');
  });

  it("refreshOutcome renvoie 'denied' sur 401", async () => {
    mod.setAccessToken('old');
    fetchMock.mockResolvedValue(json(401, {}));
    expect(await mod.refreshOutcome()).toBe('denied');
    expect(mod.getAccessToken()).toBeNull();
  });

  it.each([503, 502])("refreshOutcome renvoie 'unreachable' sur %i", async (status) => {
    mod.setAccessToken('old');
    fetchMock.mockResolvedValue(json(status, {}));
    expect(await mod.refreshOutcome()).toBe('unreachable');
    expect(mod.getAccessToken()).toBeNull();
  });

  it("refreshOutcome renvoie 'unreachable' quand fetch rejette", async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await mod.refreshOutcome()).toBe('unreachable');
  });

  it("le refresh est plafonné par un signal d'abandon", async () => {
    fetchMock.mockResolvedValue(json(200, { accessToken: 'a' }));
    await mod.refreshOutcome();
    expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it("sans AbortSignal.timeout (anciens navigateurs), le refresh part quand même", async () => {
    const original = AbortSignal.timeout;
    (AbortSignal as { timeout?: unknown }).timeout = undefined;
    try {
      fetchMock.mockResolvedValue(json(200, { accessToken: 'a' }));
      expect(await mod.refreshOutcome()).toBe('ok');
      expect((fetchMock.mock.calls[0][1] as RequestInit).signal).toBeUndefined();
    } finally {
      AbortSignal.timeout = original;
    }
  });

  it("une attente du verrou abandonnée donne 'unreachable' sans token", async () => {
    mod.setAccessToken('old');
    const request = jest.fn(() => Promise.reject(new DOMException('x', 'AbortError')));
    Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true });
    expect(await mod.refreshOutcome()).toBe('unreachable');
    expect(mod.getAccessToken()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('api.logout rejette quand le serveur répond 500 ou que fetch rejette', async () => {
    fetchMock.mockResolvedValueOnce(json(500, {}));
    await expect(mod.api.logout()).rejects.toMatchObject({ status: 500 });
    fetchMock.mockRejectedValueOnce(new Error('réseau'));
    await expect(mod.api.logout()).rejects.toThrow('réseau');
  });

  it('n’écrit jamais dans localStorage', async () => {
    const setItem = jest.fn();
    Object.defineProperty(globalThis, 'localStorage', {
      value: { setItem, getItem: jest.fn(), removeItem: jest.fn() },
      configurable: true,
    });
    fetchMock.mockResolvedValue(json(200, { accessToken: 'a', user: {} }));
    await mod.api.login('a@b.c', 'pw');
    mod.setAccessToken('a');
    await mod.refreshSession();
    expect(setItem).not.toHaveBeenCalled();
    delete (globalThis as { localStorage?: unknown }).localStorage;
  });
});

describe('upload de fichier sur le web', () => {
  it('envoie un vrai fichier (pas un objet {uri}) dans le FormData', async () => {
    const { Platform } = jest.requireActual('react-native');
    const original = Platform.OS;
    Platform.OS = 'web';
    try {
      fetchMock.mockImplementation(async (url: string) =>
        url === 'blob:photo'
          ? ({ blob: async () => new Blob(['x'], { type: 'image/png' }) } as Response)
          : json(200, { id: 'a1' }),
      );
      await mod.api.uploadAnimalPhoto('a1', { uri: 'blob:photo', name: 'chat.png', type: 'image/png' });
      const body = (fetchMock.mock.calls[1][1] as RequestInit).body as FormData;
      const sent = body.get('photo') as File;
      expect(sent).toBeInstanceOf(File);
      expect(sent.name).toBe('chat.png');
      expect(sent.type).toBe('image/png');
    } finally {
      Platform.OS = original;
    }
  });
});
