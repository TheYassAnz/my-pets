import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { HealthEventForm } from '@/components/health-event-form';
import { Button, ErrorState, Skeleton, useToast } from '@/components/ui';
import { api, ApiError, type HealthEvent, type HealthEventInput } from '@/lib/api';

export default function EditHealthEventScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const [event, setEvent] = useState<HealthEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { show } = useToast();

  const load = useCallback(() => {
    // Purger l'erreur avant chaque tentative : sans cela, `error` reste positionné
    // après un « Réessayer » réussi et l'écran d'erreur ne disparaît jamais.
    setError(null);
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

  const onSubmit = async (input: HealthEventInput) => {
    await api.updateEvent(id, eventId, input);
    show('Événement mis à jour');
    router.back();
  };

  const onDelete = () => {
    Alert.alert('Supprimer cet événement ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteEvent(id, eventId);
            router.back();
          } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Suppression impossible');
          }
        },
      },
    ]);
  };

  if (error) {
    return (
      <View className="flex-1 justify-center bg-surface">
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-surface p-4">
        <Skeleton variant="card" count={1} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="px-8 pt-8 pb-16 gap-4">
      <HealthEventForm
        initial={{
          type: event.type,
          title: event.title,
          date: event.date,
          dosage: event.dosage ?? undefined,
          vet: event.vet ?? undefined,
          notes: event.notes ?? undefined,
          nextDueDate: event.nextDueDate ?? undefined,
        }}
        submitLabel="Enregistrer"
        onSubmit={onSubmit}
      />

      <Button label="Supprimer" variant="destructive" icon="trash" onPress={onDelete} />
    </ScrollView>
  );
}
