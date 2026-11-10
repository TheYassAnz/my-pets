let ApiError: typeof import('@/lib/api').ApiError;
let exportAndShareHealthRecord: typeof import('@/lib/export').exportAndShareHealthRecord;

const json = (status: number, body?: unknown) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

let fetchMock: jest.Mock;
let link: { href: string; download: string; click: jest.Mock; remove: jest.Mock };
let appendChild: jest.Mock;
let createElement: jest.Mock;

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'http://api.test/api';
  jest.resetModules();
  /* eslint-disable @typescript-eslint/no-require-imports -- reset des variables de module */
  const api = require('@/lib/api');
  ({ ApiError } = api);
  ({ exportAndShareHealthRecord } = require('@/lib/export'));
  /* eslint-enable @typescript-eslint/no-require-imports */
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.useFakeTimers();
  link = { href: '', download: '', click: jest.fn(), remove: jest.fn() };
  createElement = jest.fn(() => link);
  appendChild = jest.fn();
  (global as unknown as { document: unknown }).document = { createElement, body: { appendChild } };
  URL.createObjectURL = jest.fn(() => 'blob:pdf');
  URL.revokeObjectURL = jest.fn();
  api.setAccessToken('tok');
});

afterEach(() => {
  jest.useRealTimers();
  delete (global as unknown as { document?: unknown }).document;
});

it('télécharge le PDF avec le Bearer, clique le lien et révoque l’URL', async () => {
  const blob = new Blob(['%PDF']);
  fetchMock.mockResolvedValue({ ...json(200), blob: async () => blob });

  await exportAndShareHealthRecord('a1', 'Rex le Chien');

  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toMatch(/\/animals\/a1\/export$/);
  expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  expect(createElement).toHaveBeenCalledWith('a');
  expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  expect(link.href).toBe('blob:pdf');
  expect(link.download).toBe('carnet-rex-le-chien.pdf');
  expect(link.click).toHaveBeenCalledTimes(1);
  expect(appendChild).toHaveBeenCalledWith(link);
  expect(link.remove).toHaveBeenCalledTimes(1);
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1000);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:pdf');
});

it('révoque quand même l’URL après le délai si click() lève', async () => {
  fetchMock.mockResolvedValue({ ...json(200), blob: async () => new Blob(['%PDF']) });
  link.click.mockImplementation(() => {
    throw new Error('boom');
  });

  await expect(exportAndShareHealthRecord('a1', 'Rex')).rejects.toThrow('boom');
  expect(link.remove).toHaveBeenCalledTimes(1);
  expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1000);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:pdf');
});

it('rejette ApiError sans créer de lien sur une 404', async () => {
  fetchMock.mockResolvedValue(json(404, { message: 'Introuvable' }));

  await expect(exportAndShareHealthRecord('a1', 'Rex')).rejects.toBeInstanceOf(ApiError);
  expect(createElement).not.toHaveBeenCalled();
});
