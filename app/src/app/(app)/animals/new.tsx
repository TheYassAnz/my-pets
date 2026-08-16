import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { Button, DateField, FormField, SpeciesPicker, useToast } from '@/components/ui';
import { OTHER_SPECIES, resolveSpecies } from '@/lib/animals';
import { api, ApiError } from '@/lib/api';
import { animalSchema, type AnimalValues } from '@/lib/forms/schemas';

export default function NewAnimalScreen() {
  const { show } = useToast();
  const [error, setError] = useState<string | null>(null);
  const speciesOtherRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<AnimalValues>({
    resolver: zodResolver(animalSchema),
    mode: 'onTouched',
    defaultValues: { name: '', speciesChoice: 'Chien', speciesOther: '', birthDate: null },
  });

  // `useWatch` plutôt que `watch()` : cette dernière renvoie une fonction que le
  // React Compiler ne peut pas mémoïser, ce qui lui fait sauter tout l'écran.
  const speciesChoice = useWatch({ control, name: 'speciesChoice' });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await api.createAnimal({
        name: values.name.trim(),
        species: resolveSpecies({ choice: values.speciesChoice, other: values.speciesOther }),
        birthDate: values.birthDate ?? undefined,
      });
      show('Animal ajouté');
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Création impossible');
    }
  });

  return (
    <View className="flex-1 bg-surface px-8 pt-8 gap-4">
      <FormField
        control={control}
        name="name"
        label="Nom"
        returnKeyType="next"
        // L'espèce et la date n'acceptent pas le focus clavier : la chaîne
        // s'arrête ici, sauf lorsque « Autre » ouvre un champ texte (PET-7).
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
          onSubmitEditing={onSubmit}
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

      {error && <Text className="text-body text-danger">{error}</Text>}

      <Button label="Ajouter" loading={formState.isSubmitting} onPress={onSubmit} />
    </View>
  );
}
