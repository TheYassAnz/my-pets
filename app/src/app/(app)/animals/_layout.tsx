import { Stack } from 'expo-router';

export default function AnimalsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Mes animaux' }} />
      <Stack.Screen name="new" options={{ title: 'Ajouter un animal', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Animal' }} />
    </Stack>
  );
}
