import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { registerServiceWorker } from '@/lib/pwa';

type Listener = (event: any) => void;

function loadSw(opts: { fetch?: jest.Mock; cached?: Record<string, unknown> } = {}) {
  const listeners: Record<string, Listener> = {};
  const showNotification = jest.fn(() => Promise.resolve());
  const openWindow = jest.fn(() => Promise.resolve());
  const cache = { add: jest.fn(), put: jest.fn() };
  const caches = {
    open: jest.fn(async () => cache),
    match: jest.fn(async (req: any) => opts.cached?.[typeof req === 'string' ? req : req.url]),
    keys: jest.fn(async () => []),
    delete: jest.fn(),
  };
  const self: any = {
    addEventListener: (type: string, fn: Listener) => (listeners[type] = fn),
    location: { origin: 'https://app.test' },
    registration: { showNotification },
    clients: { openWindow, claim: jest.fn() },
    skipWaiting: jest.fn(),
  };
  const code = fs.readFileSync(path.join(__dirname, '../../../public/sw.js'), 'utf8');
  vm.runInNewContext(code, { self, caches, URL, fetch: opts.fetch ?? jest.fn(), Promise });
  return { listeners, showNotification, openWindow, caches };
}

function fetchEvent(url: string, init: { method?: string; mode?: string } = {}) {
  return {
    request: { url: `https://app.test${url}`, method: init.method ?? 'GET', mode: init.mode ?? 'cors' },
    respondWith: jest.fn(),
  };
}

describe('service worker', () => {
  it('ne gère jamais /api/ ni les requêtes non GET', () => {
    const { listeners } = loadSw();
    const get = fetchEvent('/api/animals');
    const post = fetchEvent('/_expo/static/js/web/entry-abc.js', { method: 'POST' });
    const nav = fetchEvent('/api/export', { mode: 'navigate' });
    [get, post, nav].forEach((e) => listeners.fetch(e));
    expect(get.respondWith).not.toHaveBeenCalled();
    expect(post.respondWith).not.toHaveBeenCalled();
    expect(nav.respondWith).not.toHaveBeenCalled();
  });

  it('sert les fichiers statiques hachés cache d\'abord', async () => {
    const hit = { ok: true };
    const { listeners } = loadSw({
      cached: { 'https://app.test/_expo/static/js/web/entry-abc.js': hit },
    });
    const e = fetchEvent('/_expo/static/js/web/entry-abc.js');
    listeners.fetch(e);
    expect(e.respondWith).toHaveBeenCalledTimes(1);
    await expect(e.respondWith.mock.calls[0][0]).resolves.toBe(hit);
  });

  it('navigation : réseau d\'abord, repli sur /index.html en cache', async () => {
    const shell = { ok: true, shell: true };
    const { listeners } = loadSw({
      fetch: jest.fn(() => Promise.reject(new Error('offline'))),
      cached: { '/index.html': shell },
    });
    const e = fetchEvent('/animals/a1', { mode: 'navigate' });
    listeners.fetch(e);
    await expect(e.respondWith.mock.calls[0][0]).resolves.toBe(shell);
  });

  it('push affiche la notification', async () => {
    const { listeners, showNotification } = loadSw();
    const waitUntil = jest.fn();
    listeners.push({
      data: { json: () => ({ title: 'T', body: 'B', url: '/animals/a1' }) },
      waitUntil,
    });
    expect(showNotification).toHaveBeenCalledWith('T', {
      body: 'B',
      data: { url: '/animals/a1' },
      icon: '/icons/icon-192.png',
    });
  });

  it('push sans données ou JSON invalide ne lève pas', () => {
    const { listeners, showNotification } = loadSw();
    const waitUntil = jest.fn();
    expect(() => listeners.push({ data: null, waitUntil })).not.toThrow();
    expect(() =>
      listeners.push({
        data: {
          json: () => {
            throw new SyntaxError('bad');
          },
        },
        waitUntil,
      }),
    ).not.toThrow();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it.each([
    ['/animals/a1', '/animals/a1'],
    ['https://evil.test', '/'],
    ['//evil.test', '/'],
    [undefined, '/'],
  ])('notificationclick %s ouvre %s', (url, expected) => {
    const { listeners, openWindow } = loadSw();
    const close = jest.fn();
    listeners.notificationclick({ notification: { close, data: { url } }, waitUntil: jest.fn() });
    expect(close).toHaveBeenCalled();
    expect(openWindow).toHaveBeenCalledWith(expected);
  });
});

describe('registerServiceWorker', () => {
  it('renvoie null sans navigator.serviceWorker', async () => {
    await expect(registerServiceWorker()).resolves.toBeNull();
  });
});
