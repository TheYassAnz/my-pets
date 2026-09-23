import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DateField, FormField, Wizard, useToast } from '@/components/ui';
import { api, ApiError, type HealthEventType } from '@/lib/api';
import { healthEventSchema, type HealthEventValues } from '@/lib/forms/schemas';
import { EVENT_LABELS, EVENT_TYPES } from '@/lib/health-events';

export default function NewHealthEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { show } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const { control, handleSubmit, formState, setValue } = useForm<HealthEventValues>({
    resolver: zodResolver(healthEventSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'VACCINE',
      title: '',
      date: new Date().toISOString().slice(0, 10),
      dosage: '',
      vet: '',
      notes: '',
      nextDueDate: null,
    },
  });

  const type = useWatch({ control, name: 'type' });
  const title = useWatch({ control, name: 'title' });
  const date = useWatch({ control, name: 'date' });

  const vetRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const isStepValid = () => {
    if (step === 0) return true; // Type est toujours défini par défaut
    if (step === 1) return title.trim().length > 0 && date.trim().length > 0;
    return true; // Étape 3 optionnelle
  };

  const handleNext = () => {
    if (step === 0 && !title) {
      // Pré-remplir le titre avec le label du type si vide
      setValue('title', EVENT_LABELS[type as HealthEventType]);
    }
    
    if (step < 2) {
      setStep(step + 1);
    } else {
      onSubmit();
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await api.createEvent(id, {
        type: values.type as HealthEventType,
        title: values.title.trim(),
        date: values.date,
        dosage: values.dosage.trim() || undefined,
        vet: values.vet.trim() || undefined,
        notes: values.notes.trim() || undefined,
        nextDueDate: values.nextDueDate ?? undefined,
      });
      show('Événement ajouté');
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible');
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
            <Text className="text-display font-bold text-text mb-8">De quel événement s'agit-il ?</Text>
            
            <View className="gap-3">
              {EVENT_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setValue('type', t, { shouldValidate: true })}
                  className={`px-5 py-4 rounded-xl border-2 flex-row items-center justify-between ${
                    type === t
                      ? 'border-text bg-text'
                      : 'border-transparent bg-surface-sunken'
                  }`}
                >
                  <Text
                    className={`text-headline font-semibold ${
                      type === t ? 'text-surface' : 'text-text'
                    }`}
                  >
                    {EVENT_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View className="flex-1 justify-center pb-20 gap-6">
            <Text className="text-display font-bold text-text mb-4">Détails de l'événement</Text>
            
            <FormField
              control={control}
              name="title"
              label="Titre"
              placeholder="Ex: Rappel annuel..."
              autoFocus
              returnKeyType="next"
              onSubmitEditing={handleNext}
            />

            <Controller
              control={control}
              name="date"
              render={({ field, fieldState }) => (
                <DateField
                  label="Date de l'événement"
                  value={field.value || null}
                  onChange={(val) => field.onChange(val ?? '')}
                  error={fieldState.error?.message}
                  maximumDate={new Date()}
                />
              )}
            />
            
            <Controller
              control={control}
              name="nextDueDate"
              render={({ field, fieldState }) => (
                <DateField
                  label="Prochain rappel"
                  placeholder="Optionnel"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  clearable
                />
              )}
            />
          </View>
        )}

        {step === 2 && (
          <View className="flex-1 justify-center pb-20 gap-6">
            <Text className="text-display font-bold text-text mb-4">Informations complémentaires</Text>
            <Text className="text-body text-text-secondary mb-4">
              Ces champs sont facultatifs.
            </Text>

            <FormField
              control={control}
              name="dosage"
              label="Dosage / Médicament"
              placeholder="Optionnel"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => vetRef.current?.focus()}
            />

            <FormField
              control={control}
              name="vet"
              label="Vétérinaire ou Clinique"
              placeholder="Optionnel"
              inputRef={vetRef}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => notesRef.current?.focus()}
            />

            <FormField
              control={control}
              name="notes"
              label="Notes"
              placeholder="Optionnel"
              inputRef={notesRef}
              multiline
            />

            {error && <Text className="text-body text-danger mt-4">{error}</Text>}
          </View>
        )}
      </Wizard>
    </>
  );
}
