import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { HealthEventForm } from '@/components/health-event-form';
import { api, ApiError, type HealthEvent, type HealthEventInput } from '@/lib/api';

export default function EditHealthEventScreen() {
  const { id, eventId } = useLocalSearchParams<{ id: string; eventId: string }>();
  const [event, setEvent] = useState<HealthEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      api
        .getEvent(id, eventId)
        .then(setEvent)
        .catch((e: unknown) => {
          setError(e instanceof ApiError ? e.message : 'Chargement impossible');
        });
    }, [id, eventId]),
  );

  const onSubmit = async (input: HealthEventInput) => {
    await api.updateEvent(id, eventId, input);
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
      <View className="flex-1 items-center justify-center bg-white dark:bg-black px-8">
        <Text className="text-red-600 dark:text-red-400 text-center">{error}</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
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

      <Pressable
        className="rounded-xl border border-red-300 dark:border-red-800 py-3 items-center active:opacity-70"
        onPress={onDelete}>
        <Text className="text-red-600 dark:text-red-400 font-semibold">Supprimer</Text>
      </Pressable>
    </ScrollView>
  );
}
