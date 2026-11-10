import { zodResolver } from '@hookform/resolvers/zod';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { AnimalForm, pickAnimalPhoto } from '@/components/animal-form';
import { ErrorState, Skeleton, Text, useToast } from '@/components/ui';
import { resolveSpecies, splitSpecies } from '@/lib/animals';
import { api, ApiError, type Animal } from '@/lib/api';
import { confirmAction } from '@/lib/dialog';
import { animalSchema, type AnimalValues } from '@/lib/forms/schemas';

export default function EditAnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { show } = useToast();

  const { control, handleSubmit, reset, formState } = useForm<AnimalValues>({
    resolver: zodResolver(animalSchema),
    defaultValues: { name: '', speciesChoice: 'Chien', speciesOther: '', birthDate: null },
  });

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

  const onDelete = async () => {
    if (!(await confirmAction('Supprimer cet animal ?', 'Cette action est irréversible.'))) return;
    try {
      await api.deleteAnimal(id);
      // Replace allows us to completely back out of the animal details flow
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Suppression impossible');
    }
  };

  const onPickPhoto = async () => {
    const picked = await pickAnimalPhoto();
    if (!picked) return;
    if ('error' in picked) {
      setError(picked.error);
      return;
    }
    setUploadingPhoto(true);
    try {
      setAnimal(await api.uploadAnimalPhoto(id, picked.photo));
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
    <AnimalForm
      title={`Modifier ${animal.name}`}
      control={control}
      photoUri={animal.photoUrl}
      uploadingPhoto={uploadingPhoto}
      onPickPhoto={onPickPhoto}
      onSubmit={onSave}
      submitting={formState.isSubmitting}
      error={error}
      footer={
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          className="min-h-11 items-center justify-center">
          <Text className="text-body font-semibold text-danger">{"Supprimer l'animal"}</Text>
        </Pressable>
      }
    />
  );
}
