import { Stack } from 'expo-router';

export default function AnimalsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Mes animaux' }} />
      <Stack.Screen name="new" options={{ title: 'Ajouter un animal', presentation: 'modal' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Animal' }} />
      <Stack.Screen
        name="[id]/events/new"
        options={{ title: 'Nouvel événement', presentation: 'modal' }}
      />
      <Stack.Screen
        name="[id]/events/scan"
        options={{ title: 'Scanner un document', presentation: 'modal' }}
      />
      <Stack.Screen name="[id]/events/[eventId]" options={{ title: 'Événement' }} />
    </Stack>
  );
}
