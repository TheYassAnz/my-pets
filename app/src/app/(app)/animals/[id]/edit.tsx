import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams, Stack } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { z } from 'zod';

import {
  Avatar,
  Button,
  Card,
  DateField,
  ErrorState,
  FormField,
  Skeleton,
  SpeciesPicker,
  useToast,
} from '@/components/ui';
import { api, ApiError, type Animal } from '@/lib/api';
import { resolveSpecies, splitSpecies, OTHER_SPECIES } from '@/lib/animals';


const schema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  speciesChoice: z.string().min(1, 'L’espèce est requise'),
  speciesOther: z.string().optional(),
  birthDate: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

export default function EditAnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { show } = useToast();

  const { control, handleSubmit, reset, watch, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', speciesChoice: '', speciesOther: '', birthDate: null },
  });

  const speciesChoice = watch('speciesChoice');
  const speciesOtherRef = useRef<TextInput>(null);

  const load = useCallback(() => {
    setError(null);
    api
      .getAnimal(id)
      .then((a) => {
        setAnimal(a);
        const species = splitSpecies(a.species);
        reset({
          name: a.name,
          speciesChoice: species.choice,
          speciesOther: species.other,
          birthDate: a.birthDate ? a.birthDate.slice(0, 10) : null,
        });
      })
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : 'Chargement impossible');
      });
  }, [id, reset]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onSave = handleSubmit(async (values) => {
    setError(null);
    try {
      const updated = await api.updateAnimal(id, {
        name: values.name.trim(),
        species: resolveSpecies({ choice: values.speciesChoice, other: values.speciesOther }),
        birthDate: values.birthDate ?? undefined,
      });
      setAnimal(updated);
      show('Animal mis à jour');
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Mise à jour impossible');
    }
  });

  const onDelete = () => {
    Alert.alert('Supprimer cet animal ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteAnimal(id);
            // Replace allows us to completely back out of the animal details flow
            router.replace('/animals');
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

  if (error && !animal) {
    return (
      <View className="flex-1 justify-center bg-surface">
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  if (!animal) {
    return (
      <View className="flex-1 bg-surface p-4">
        <Skeleton variant="card" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="p-4 gap-8 pb-12">
      <Stack.Screen options={{ title: 'Modifier', presentation: 'modal' }} />
      {error ? <Text className="text-body text-danger">{error}</Text> : null}

      <View className="gap-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Changer la photo"
          disabled={uploadingPhoto}
          onPress={onPickPhoto}
          className="items-center gap-2 mb-4">
          <Avatar uri={animal.photoUrl} size="lg" />
          <Text className="text-body text-primary">
            {uploadingPhoto ? 'Envoi…' : 'Changer la photo'}
          </Text>
        </Pressable>

        <FormField
          control={control}
          name="name"
          label="Nom"
          returnKeyType="next"
          submitBehavior={speciesChoice === OTHER_SPECIES ? 'submit' : 'blurAndSubmit'}
          onSubmitEditing={() => speciesOtherRef.current?.focus()}
        />

        <Controller
          control={control}
          name="speciesChoice"
          render={({ field, fieldState }) => (
            <SpeciesPicker
              label="Espèce"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        {speciesChoice === OTHER_SPECIES ? (
          <FormField
            control={control}
            name="speciesOther"
            label="Préciser l'espèce"
            placeholder="Ex : Furet, Cheval…"
            inputRef={speciesOtherRef}
            returnKeyType="done"
            onSubmitEditing={onSave}
          />
        ) : null}

        <Controller
          control={control}
          name="birthDate"
          render={({ field, fieldState }) => (
            <DateField
              label="Date de naissance"
              placeholder="Optionnelle"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              clearable
              maximumDate={new Date()}
            />
          )}
        />

        <View className="mt-2">
          <Button label="Enregistrer" loading={formState.isSubmitting} onPress={onSave} />
        </View>
      </View>

      <View className="pt-8 items-center border-t border-border">
        <Pressable accessibilityRole="button" onPress={onDelete} className="p-4">
          <Text className="text-body font-semibold text-danger">Supprimer cet animal</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
