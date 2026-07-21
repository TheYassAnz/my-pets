import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Input, useToast } from '@/components/ui';
import { api, ApiError } from '@/lib/api';

export default function NewAnimalScreen() {
  const { show } = useToast();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !species.trim()) {
      setError('Nom et espèce requis');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.createAnimal({ name: name.trim(), species: species.trim() });
      show('Animal ajouté');
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-surface px-8 pt-8 gap-4">
      <Input label="Nom" value={name} onChangeText={setName} />
      <Input
        label="Espèce"
        placeholder="Ex: Chien, Chat"
        value={species}
        onChangeText={setSpecies}
        onSubmitEditing={onSubmit}
      />

      {error && <Text className="text-callout text-danger">{error}</Text>}

      <Button label="Ajouter" loading={submitting} onPress={onSubmit} />
    </View>
  );
}
