import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { HealthEventForm } from '@/components/health-event-form';
import {
  api,
  ApiError,
  type ExtractedHealthEvent,
  type HealthEventInput,
} from '@/lib/api';
import { AI_EXTRACTION_ENABLED } from '@/lib/features';

// L'extraction pré-remplit le formulaire : l'utilisateur corrige et valide
// toujours avant sauvegarde (jamais d'enregistrement automatique)
export default function ScanHealthEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedHealthEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (asset: ImagePicker.ImagePickerAsset) => {
    setError(null);
    setExtracting(true);
    try {
      const result = await api.extractEvent(id, {
        uri: asset.uri,
        name: asset.fileName ?? 'document.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      setExtracted(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Analyse de l'image impossible");
    } finally {
      setExtracting(false);
    }
  };

  const onTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Autorisation d'accès à la caméra requise");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    await analyze(result.assets[0]);
  };

  const onPickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorisation d'accès aux photos requise");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    await analyze(result.assets[0]);
  };

  const onSubmit = async (input: HealthEventInput) => {
    await api.createEvent(id, input);
    router.back();
  };

  // Écran atteignable uniquement par lien direct quand la fonctionnalité est coupée
  if (!AI_EXTRACTION_ENABLED) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black px-8">
        <Text className="text-gray-500 dark:text-gray-400 text-center">
          L&apos;extraction automatique est momentanément indisponible. Vous
          pouvez saisir l&apos;événement manuellement.
        </Text>
      </View>
    );
  }

  if (extracting) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white dark:bg-black">
        <ActivityIndicator size="large" />
        <Text className="text-gray-500 dark:text-gray-400">
          Analyse du document en cours…
        </Text>
      </View>
    );
  }

  if (extracted) {
    return (
      <ScrollView
        className="flex-1 bg-white dark:bg-black"
        contentContainerClassName="px-8 pt-8 pb-16 gap-4">
        <Text className="text-gray-500 dark:text-gray-400 text-sm">
          Vérifiez et corrigez les informations extraites avant d&apos;enregistrer.
        </Text>
        <HealthEventForm
          initial={{
            type: extracted.type ?? undefined,
            title: extracted.title ?? undefined,
            date: extracted.date ?? undefined,
            dosage: extracted.dosage ?? undefined,
            vet: extracted.vet ?? undefined,
            notes: extracted.notes ?? undefined,
            nextDueDate: extracted.nextDueDate ?? undefined,
          }}
          submitLabel="Ajouter"
          onSubmit={onSubmit}
        />
        <Pressable
          className="items-center py-2 active:opacity-70"
          onPress={() => setExtracted(null)}>
          <Text className="text-blue-600 text-sm">Scanner un autre document</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black px-8 pt-8 gap-4">
      <Text className="text-gray-500 dark:text-gray-400 text-sm">
        Photographiez une ordonnance ou une page du carnet de santé : les
        informations seront extraites automatiquement, puis vous pourrez les
        vérifier avant de les enregistrer.
      </Text>

      <Pressable
        className="rounded-xl bg-blue-600 py-3 items-center active:opacity-80"
        onPress={onTakePhoto}>
        <Text className="text-white font-semibold text-base">📷 Prendre une photo</Text>
      </Pressable>

      <Pressable
        className="rounded-xl border border-gray-300 dark:border-gray-700 py-3 items-center active:opacity-70"
        onPress={onPickFromLibrary}>
        <Text className="text-black dark:text-white font-semibold text-base">
          Choisir depuis la galerie
        </Text>
      </Pressable>

      {error && <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>}
    </View>
  );
}
