import { Stack, useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { EntryForm } from '@/components/entry-form';
import { ErrorState, Skeleton } from '@/components/ui';
import { confirmAction, notifyError } from '@/lib/dialog';
import { api, ApiError, type Animal, type HealthEvent } from '@/lib/api';

export default function EditHealthEventScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const [event, setEvent] = useState<HealthEvent | null>(null);
  const [animal, setAnimal] = useState<Animal | undefined>();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    // Purger l'erreur avant chaque tentative : sans cela, `error` reste positionné
    // après un « Réessayer » réussi et l'écran d'erreur ne disparaît jamais.
    setError(null);
    // Le rappel « Pour <nom> » est décoratif : un échec de chargement est ignoré.
    api.getAnimal(id).then(setAnimal, () => {});
    return api
      .getEvent(id, eventId)
      .then(setEvent)
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : 'Chargement impossible');
      });
  }, [id, eventId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onDelete = async () => {
    const ok = await confirmAction('Supprimer cet événement ?', 'Cette action est irréversible.', {
      confirmLabel: 'Supprimer',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.deleteEvent(id, eventId);
      router.back();
    } catch (e) {
      notifyError(e instanceof ApiError ? e.message : 'Suppression impossible');
    }
  };

  let body;
  if (error) {
    body = (
      <View className="flex-1 justify-center bg-surface">
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  } else if (!event) {
    body = (
      <View className="flex-1 bg-surface p-4">
        <Skeleton variant="card" count={1} />
      </View>
    );
  } else {
    body = <EntryForm animalId={id} animal={animal} event={event} onDelete={onDelete} />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      {body}
    </>
  );
}
