/* Service worker my-pets : coque hors-ligne + notifications push. Jamais de cache sur /api/. */
const CACHE = 'my-pets-shell-v1';
const SHELL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    // Réseau d'abord : un nouveau déploiement n'est jamais masqué par un ancien shell.
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(SHELL, copy));
          }
          return res;
        })
        .catch(() => caches.match(SHELL)),
    );
    return;
  }

  if (url.pathname.startsWith('/_expo/static/')) {
    // Fichiers hachés : immuables, cache d'abord.
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok && res.type === 'basic') {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
  }
});

self.addEventListener('push', (event) => {
  let payload;
  try {
    payload = event.data && event.data.json();
  } catch {
    return;
  }
  if (!payload || typeof payload.title !== 'string') return;
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      data: { url: payload.url },
      icon: '/icons/icon-192.png',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data && event.notification.data.url;
  // Chemin interne uniquement : refuse les URL absolues et "//hote".
  const url = typeof target === 'string' && /^\/(?!\/)/.test(target) ? target : '/';
  event.waitUntil(self.clients.openWindow(url));
});
