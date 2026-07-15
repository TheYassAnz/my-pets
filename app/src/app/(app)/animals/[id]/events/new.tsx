import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';

import { HealthEventForm } from '@/components/health-event-form';
import { api, type HealthEventInput } from '@/lib/api';

export default function NewHealthEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const onSubmit = async (input: HealthEventInput) => {
    await api.createEvent(id, input);
    router.back();
  };

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="px-8 pt-8 pb-16">
      <HealthEventForm submitLabel="Ajouter" onSubmit={onSubmit} />
    </ScrollView>
  );
}
