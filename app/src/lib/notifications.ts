import { api } from './api';
import { registerServiceWorker } from './pwa';

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    typeof Notification !== 'undefined' &&
    !!process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY
  );
}

// applicationServerKey attend des octets, la clé VAPID est en base64url
function urlBase64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const std = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(std), (c) => c.charCodeAt(0));
}

/** À appeler uniquement depuis un clic (exigence iOS/Safari). */
export async function enablePushReminders(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!pushSupported()) return 'unsupported';
  if ((await Notification.requestPermission()) !== 'granted') return 'denied';
  const reg = await registerServiceWorker();
  if (!reg) return 'unsupported';
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToBytes(process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY as string),
  });
  await api.savePushSubscription(sub.toJSON() as PushSubscriptionJSON);
  return 'granted';
}

async function currentSubscription(): Promise<PushSubscription | null> {
  try {
    if (!pushSupported()) return null;
    const reg = await registerServiceWorker();
    return (await reg?.pushManager.getSubscription()) ?? null;
  } catch {
    return null;
  }
}

/**
 * Supprime l'abonnement côté serveur (session valide requise) et renvoie
 * l'abonnement local, à désabonner une fois la déconnexion réussie. Ne lève jamais.
 */
export async function detachPushSubscription(): Promise<PushSubscription | null> {
  const sub = await currentSubscription();
  if (sub) await api.removePushSubscription(sub.endpoint).catch(() => {});
  return sub;
}

export async function disablePushReminders(): Promise<void> {
  const sub = await detachPushSubscription();
  await sub?.unsubscribe().catch(() => {});
}
