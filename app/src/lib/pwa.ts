/** Enregistre le service worker (web, contexte sécurisé uniquement). Ne lève jamais. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
    const host = globalThis.location?.hostname;
    const secure = globalThis.location?.protocol === 'https:' || host === 'localhost';
    if (!secure) return null;
    return await navigator.serviceWorker.register('/sw.js');
  } catch {
    return null;
  }
}
