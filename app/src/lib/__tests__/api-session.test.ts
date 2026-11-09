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

    const request = jest.fn((_name: string, cb: () => Promise<unknown>) => cb());
    Object.defineProperty(navigator, 'locks', { value: { request }, configurable: true });
    await expect(mod.refreshSession()).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('mypets-refresh', expect.any(Function));
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
