import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { enablePushReminders, pushSupported } from '@/lib/notifications';

// iPadOS se présente comme un Mac tactile
function isIos(): boolean {
  const nav = navigator;
  return /iPhone|iPad|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches === true;
}

export function ReminderPrompt() {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Permission déjà accordée (ex. après une reconnexion) : ré-abonnement silencieux, idempotent
  useEffect(() => {
    if (typeof window === 'undefined' || !pushSupported()) return;
    if (Notification.permission === 'granted') enablePushReminders().catch(() => {});
  }, []);

  if (typeof window === 'undefined' || done) return null;

  if (!pushSupported()) {
    if (!(isIos() && !isStandalone())) return null;
    return (
      <Card className="mb-3 p-4">
        <Text className="text-[15px] text-text-secondary">
          Pour recevoir les rappels sur iPhone, ajoutez my-pets à l&apos;écran d&apos;accueil
          (Partager, puis « Sur l&apos;écran d&apos;accueil »). Vous les recevez aussi par email.
        </Text>
      </Card>
    );
  }

  if (Notification.permission !== 'default') return null;

  const onPress = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const res = await enablePushReminders();
      if (res === 'unsupported') setFailed(true);
      else setDone(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mb-3">
      <Button label="Activer les rappels" icon="bell" loading={busy} onPress={onPress} />
      {failed ? (
        <Text accessibilityRole="alert" className="mt-2 text-[14px] text-text-secondary">
          Impossible d&apos;activer les rappels. Réessayez.
        </Text>
      ) : null}
    </View>
  );
}
