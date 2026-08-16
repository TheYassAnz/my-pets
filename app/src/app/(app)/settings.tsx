import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, Card, Chip, ErrorState, Screen, Skeleton, useToast } from '@/components/ui';
import { useSession } from '@/lib/auth-context';
import { api, ApiError } from '@/lib/api';

const LEAD_DAY_OPTIONS = [30, 15, 7, 3, 1, 0];

function leadDayLabel(day: number): string {
  return day === 0 ? 'Jour J' : `J-${day}`;
}

export default function SettingsScreen() {
  const { signOut } = useSession();
  const { show } = useToast();
  const [leadDays, setLeadDays] = useState<number[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    // Purger l'erreur avant chaque tentative : sans cela, `error` reste positionné
    // après un « Réessayer » réussi et l'écran d'erreur ne disparaît jamais.
    setError(null);
    return api
      .getReminderSettings()
      .then((s) => setLeadDays(s.leadDays))
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : 'Chargement impossible');
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggle = (day: number) => {
    if (!leadDays) return;
    setLeadDays(
      leadDays.includes(day)
        ? leadDays.filter((d) => d !== day)
        : [...leadDays, day],
    );
  };

  const onSave = async () => {
    if (!leadDays || leadDays.length === 0) {
      setError('Sélectionnez au moins un délai de rappel');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const updated = await api.updateReminderSettings(leadDays);
      setLeadDays(updated.leadDays);
      show('Réglages enregistrés');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  if (error && !leadDays) {
    return (
      <Screen scroll={false} className="justify-center">
        <ErrorState message={error} onRetry={load} />
      </Screen>
    );
  }

  if (!leadDays) {
    return (
      <Screen scroll={false} className="p-4">
        <Skeleton variant="card" count={2} />
      </Screen>
    );
  }

  return (
    <Screen contentContainerClassName="p-4 gap-4">
      <Text className="text-title font-bold text-text">Réglages</Text>

      <Card>
        <Text className="text-headline font-semibold text-text">Rappels de santé</Text>
        <Text className="text-body text-text-secondary">
          Recevez une notification avant chaque échéance (vaccin, traitement,
          visite). Choisissez quand être prévenu :
        </Text>

        <View className="flex-row flex-wrap gap-2">
          {LEAD_DAY_OPTIONS.map((day) => (
            <Chip
              key={day}
              label={leadDayLabel(day)}
              selected={leadDays.includes(day)}
              onPress={() => toggle(day)}
            />
          ))}
        </View>

        {error ? <Text className="text-body text-danger">{error}</Text> : null}

        <Button label="Enregistrer" loading={saving} onPress={onSave} />
      </Card>

      <Card>
        <Text className="text-headline font-semibold text-text">Compte</Text>
        <Button label="Se déconnecter" variant="destructive" onPress={signOut} />
      </Card>
    </Screen>
  );
}
