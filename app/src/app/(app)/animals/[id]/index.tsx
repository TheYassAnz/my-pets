import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { api, ApiError, type Animal, type HealthEvent } from '@/lib/api';
import { EVENT_EMOJI, EVENT_LABELS, formatDate } from '@/lib/health-events';

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(() => {
    api
      .getAnimal(id)
      .then((a) => {
        setAnimal(a);
        setName(a.name);
        setSpecies(a.species);
      })
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : 'Chargement impossible');
      });
    api
      .listEvents(id)
      .then(setEvents)
      .catch(() => {
        // Timeline non bloquante : l'échec ne casse pas la fiche animal
      });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onSave = async () => {
    if (!name.trim() || !species.trim()) {
      setError('Nom et espèce requis');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const updated = await api.updateAnimal(id, {
        name: name.trim(),
        species: species.trim(),
      });
      setAnimal(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Mise à jour impossible');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Supprimer cet animal ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteAnimal(id);
            router.back();
          } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Suppression impossible');
          }
        },
      },
    ]);
  };

  const onPickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorisation d'accès aux photos requise");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const updated = await api.uploadAnimalPhoto(id, {
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      setAnimal(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Envoi de la photo impossible');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (!animal) {
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
      <Pressable
        className="items-center justify-center mb-2"
        onPress={onPickPhoto}
        disabled={uploadingPhoto}>
        {animal.photoUrl ? (
          <Image
            source={{ uri: animal.photoUrl }}
            className="w-28 h-28 rounded-full"
            contentFit="cover"
          />
        ) : (
          <View className="w-28 h-28 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
            {uploadingPhoto ? <ActivityIndicator /> : <Text className="text-3xl">🐾</Text>}
          </View>
        )}
        <Text className="text-blue-600 text-sm mt-2">
          {uploadingPhoto ? 'Envoi…' : 'Changer la photo'}
        </Text>
      </Pressable>

      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Nom"
        placeholderTextColor="#9ca3af"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Espèce"
        placeholderTextColor="#9ca3af"
        value={species}
        onChangeText={setSpecies}
      />

      {error && <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>}

      <Pressable
        className="rounded-xl bg-blue-600 py-3 items-center active:opacity-80 disabled:opacity-50"
        disabled={saving}
        onPress={onSave}>
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Enregistrer</Text>
        )}
      </Pressable>

      <Pressable
        className="rounded-xl border border-red-300 dark:border-red-800 py-3 items-center active:opacity-70"
        onPress={onDelete}>
        <Text className="text-red-600 dark:text-red-400 font-semibold">Supprimer</Text>
      </Pressable>

      <View className="flex-row items-center justify-between mt-8 mb-1">
        <Text className="text-lg font-bold text-black dark:text-white">
          Carnet de santé
        </Text>
        <Link href={`/animals/${id}/events/new`} asChild>
          <Pressable className="rounded-lg bg-blue-600 px-3 py-1.5 active:opacity-80">
            <Text className="text-white text-sm font-semibold">+ Événement</Text>
          </Pressable>
        </Link>
      </View>

      {events.length === 0 ? (
        <Text className="text-gray-500 dark:text-gray-400 text-sm">
          Aucun événement enregistré.
        </Text>
      ) : (
        events.map((event) => (
          <Link key={event.id} href={`/animals/${id}/events/${event.id}`} asChild>
            <Pressable className="flex-row items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-3 active:opacity-70">
              <Text className="text-2xl">{EVENT_EMOJI[event.type]}</Text>
              <View className="flex-1">
                <Text className="text-black dark:text-white font-semibold">
                  {event.title}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  {EVENT_LABELS[event.type]} · {formatDate(event.date)}
                </Text>
              </View>
              {event.nextDueDate && (
                <Text className="text-orange-600 dark:text-orange-400 text-xs">
                  Rappel {formatDate(event.nextDueDate)}
                </Text>
              )}
            </Pressable>
          </Link>
        ))
      )}
    </ScrollView>
  );
}
