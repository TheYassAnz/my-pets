import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text, TextInput, View, Pressable } from 'react-native';

import { DateField, FormField, Wizard, useToast } from '@/components/ui';
import { OTHER_SPECIES, SPECIES, resolveSpecies } from '@/lib/animals';
import { api, ApiError } from '@/lib/api';
import { animalSchema, type AnimalValues } from '@/lib/forms/schemas';

export default function NewAnimalScreen() {
  const { show } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const { control, handleSubmit, formState, setValue } = useForm<AnimalValues>({
    resolver: zodResolver(animalSchema),
    mode: 'onChange',
    defaultValues: { name: '', speciesChoice: 'Chien', speciesOther: '', birthDate: null },
  });

  const name = useWatch({ control, name: 'name' });
  const speciesChoice = useWatch({ control, name: 'speciesChoice' });
  const speciesOther = useWatch({ control, name: 'speciesOther' });

  const isStepValid = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return speciesChoice !== OTHER_SPECIES || speciesOther.trim().length > 0;
    return true; // Étape 3 (Date) est optionnelle
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onSubmit();
    }
  };

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
    <>
      <Stack.Screen 
        options={{ 
          title: `Étape ${step + 1} sur 3`,
          headerLeft: step > 0 ? () => (
            <Pressable onPress={() => setStep(step - 1)} className="p-2">
              <Text className="text-body font-semibold text-primary">Retour</Text>
            </Pressable>
          ) : undefined
        }} 
      />
      <Wizard
        onNext={handleNext}
        nextLabel={step === 2 ? 'Terminer' : 'Suivant'}
        loading={formState.isSubmitting}
        disabled={!isStepValid()}
      >
        {step === 0 && (
          <View className="flex-1 justify-center pb-20">
            <Text className="text-display font-bold text-text mb-8">Comment s'appelle votre compagnon ?</Text>
            <FormField
              control={control}
              name="name"
              placeholder="Ex: Nala, Miko..."
              autoFocus
              returnKeyType="next"
              onSubmitEditing={handleNext}
            />
          </View>
        )}

        {step === 1 && (
          <View className="flex-1 justify-center pb-20">
            <Text className="text-display font-bold text-text mb-8">De quelle espèce s'agit-il ?</Text>
            
            <View className="flex-row flex-wrap gap-3">
              {SPECIES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setValue('speciesChoice', s, { shouldValidate: true })}
                  className={`px-5 py-4 rounded-xl border-2 ${
                    speciesChoice === s
                      ? 'border-text bg-text'
                      : 'border-transparent bg-surface-sunken'
                  }`}
                >
                  <Text
                    className={`text-headline font-semibold ${
                      speciesChoice === s ? 'text-surface' : 'text-text'
                    }`}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>

            {speciesChoice === OTHER_SPECIES && (
              <View className="mt-8">
                <FormField
                  control={control}
                  name="speciesOther"
                  placeholder="Préciser l'espèce (ex: Cheval...)"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={handleNext}
                />
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View className="flex-1 justify-center pb-20">
            <Text className="text-display font-bold text-text mb-4">Quand est-il né ?</Text>
            <Text className="text-body text-text-secondary mb-8">
              Cette étape est facultative, mais elle permet d'afficher son âge sur sa fiche.
            </Text>
            <Controller
              control={control}
              name="birthDate"
              render={({ field, fieldState }) => (
                <DateField
                  label=""
                  placeholder="Choisir une date..."
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  clearable
                  maximumDate={new Date()}
                />
              )}
            />

            {error && <Text className="text-body text-danger mt-8">{error}</Text>}
          </View>
        )}
      </Wizard>
    </>
  );
}
