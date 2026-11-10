import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AnimalForm, pickAnimalPhoto, type PickedPhoto } from '@/components/animal-form';
import { useToast } from '@/components/ui';
import { resolveSpecies } from '@/lib/animals';
import { api, ApiError } from '@/lib/api';
import { animalSchema, type AnimalValues } from '@/lib/forms/schemas';

export default function NewAnimalScreen() {
  const { show } = useToast();
  const [error, setError] = useState<string | null>(null);
  // L'animal n'existe pas encore : la photo choisie n'est envoyée qu'après la création.
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);

  const { control, handleSubmit, formState } = useForm<AnimalValues>({
    resolver: zodResolver(animalSchema),
    defaultValues: { name: '', speciesChoice: 'Chien', speciesOther: '', birthDate: null },
  });

  const onPickPhoto = async () => {
    const picked = await pickAnimalPhoto();
    if (!picked) return;
    if ('error' in picked) setError(picked.error);
    else setPhoto(picked.photo);
  };

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const created = await api.createAnimal({
        name: values.name.trim(),
        species: resolveSpecies({ choice: values.speciesChoice, other: values.speciesOther }),
        birthDate: values.birthDate ?? undefined,
      });
      if (photo) {
        try {
          await api.uploadAnimalPhoto(created.id, photo);
        } catch {
          show('Animal ajouté, photo non envoyée');
          router.back();
          return;
        }
      }
      show('Animal ajouté');
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Création impossible');
    }
  });

  return (
    <AnimalForm
      title="Nouvel animal"
      control={control}
      photoUri={photo?.uri}
      onPickPhoto={onPickPhoto}
      onSubmit={onSubmit}
      submitting={formState.isSubmitting}
      error={error}
    />
  );
}
