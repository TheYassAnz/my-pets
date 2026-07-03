import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { api, ApiError } from '@/lib/api';

export default function NewAnimalScreen() {
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
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-black px-8 pt-8 gap-4">
      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Nom"
        placeholderTextColor="#9ca3af"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Espèce (ex: Chien, Chat)"
        placeholderTextColor="#9ca3af"
        value={species}
        onChangeText={setSpecies}
        onSubmitEditing={onSubmit}
      />

      {error && <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>}

      <Pressable
        className="rounded-xl bg-blue-600 py-3 items-center active:opacity-80 disabled:opacity-50"
        disabled={submitting}
        onPress={onSubmit}>
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Ajouter</Text>
        )}
      </Pressable>
    </View>
  );
}
