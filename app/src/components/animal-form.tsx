import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { Controller, useWatch, type Control } from 'react-hook-form';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Chip, DateField, FormField, Icon, Text } from '@/components/ui';
import { OTHER_SPECIES, SPECIES } from '@/lib/animals';
import type { AnimalValues } from '@/lib/forms/schemas';

export type PickedPhoto = { uri: string; name: string; type: string };

// Sélecteur de la photothèque (carré, recadrable). `null` : annulé ; sinon la
// photo, ou un message d'erreur si l'autorisation est refusée.
export async function pickAnimalPhoto(): Promise<
  { photo: PickedPhoto } | { error: string } | null
> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { error: "Autorisation d'accès aux photos requise" };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  return {
    photo: {
      uri: asset.uri,
      name: asset.fileName ?? 'photo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    },
  };
}

type AnimalFormProps = {
  title: string;
  control: Control<AnimalValues>;
  photoUri?: string | null;
  uploadingPhoto?: boolean;
  onPickPhoto: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error?: string | null;
  /** Pied de formulaire optionnel (ex. lien de suppression). */
  footer?: ReactNode;
};

export function AnimalForm({
  title,
  control,
  photoUri,
  uploadingPhoto = false,
  onPickPhoto,
  onSubmit,
  submitting,
  error,
  footer,
}: AnimalFormProps) {
  const insets = useSafeAreaInsets();
  const speciesChoice = useWatch({ control, name: 'speciesChoice' });

  return (
    <View style={{ paddingTop: insets.top }} className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerClassName="gap-6 px-5 pb-6" keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          className="h-11 w-11 justify-center">
          <Icon name="chevron-left" size={24} decorative />
        </Pressable>
        <Text accessibilityRole="header" className="text-[30px] font-extrabold text-text">
          {title}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Changer la photo"
          disabled={uploadingPhoto}
          onPress={onPickPhoto}
          className={`items-center ${uploadingPhoto ? 'opacity-50' : ''}`}>
          <Avatar uri={photoUri} size="xl" editable />
        </Pressable>

        <View className="flex-row flex-wrap gap-2">
          {SPECIES.map((s) => (
            <Controller
              key={s}
              control={control}
              name="speciesChoice"
              render={({ field }) => (
                <Chip label={s} selected={field.value === s} onPress={() => field.onChange(s)} />
              )}
            />
          ))}
        </View>

        {speciesChoice === OTHER_SPECIES ? (
          <FormField
            control={control}
            name="speciesOther"
            label="Préciser l'espèce"
            placeholder="Ex : Furet, Cheval…"
          />
        ) : null}

        <FormField control={control} name="name" label="Nom" returnKeyType="done" />

        <Controller
          control={control}
          name="birthDate"
          render={({ field, fieldState }) => (
            <DateField
              label="Date de naissance"
              placeholder="Facultatif"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              clearable
              maximumDate={new Date()}
            />
          )}
        />

        {error ? <Text className="text-body text-danger">{error}</Text> : null}
        {footer}
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) }} className="px-5 pt-3">
        <Button label="Enregistrer" loading={submitting} onPress={onSubmit} />
      </View>
    </View>
  );
}
