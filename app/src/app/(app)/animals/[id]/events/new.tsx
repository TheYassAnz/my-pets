import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { EntryForm } from '@/components/entry-form';
import { api, type Animal } from '@/lib/api';

export default function NewEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | undefined>();

  // Le rappel « Pour <nom> » est décoratif : un échec de chargement ne bloque pas la saisie.
  useEffect(() => {
    api.getAnimal(id).then(setAnimal, () => {});
  }, [id]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EntryForm animalId={id} animal={animal} />
    </>
  );
}
