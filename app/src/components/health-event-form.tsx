import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { Button, DateField, FormField, SegmentedControl } from '@/components/ui';
import type { HealthEventInput, HealthEventType } from '@/lib/api';
import { healthEventSchema, type HealthEventValues } from '@/lib/forms/schemas';
import { EVENT_LABELS, EVENT_TYPES } from '@/lib/health-events';

type Props = {
  initial?: Partial<HealthEventInput>;
  submitLabel: string;
  onSubmit: (input: HealthEventInput) => Promise<void>;
};

const TYPE_OPTIONS = EVENT_TYPES.map((t) => ({ value: t, label: EVENT_LABELS[t] }));

export function HealthEventForm({ initial, submitLabel, onSubmit }: Props) {
  const [error, setError] = useState<string | null>(null);
  const dosageRef = useRef<TextInput>(null);
  const vetRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState } = useForm<HealthEventValues>({
    resolver: zodResolver(healthEventSchema),
    mode: 'onTouched',
    defaultValues: {
      type: initial?.type ?? 'VACCINE',
      title: initial?.title ?? '',
      date: initial?.date?.slice(0, 10) ?? '',
      dosage: initial?.dosage ?? '',
      vet: initial?.vet ?? '',
      notes: initial?.notes ?? '',
      nextDueDate: initial?.nextDueDate?.slice(0, 10) ?? null,
    },
  });

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      await onSubmit({
        type: values.type as HealthEventType,
        title: values.title.trim(),
        date: values.date,
        dosage: values.dosage.trim() || undefined,
        vet: values.vet.trim() || undefined,
        notes: values.notes.trim() || undefined,
        nextDueDate: values.nextDueDate ?? undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible');
    }
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />

      <FormField
        control={control}
        name="title"
        label="Titre"
        placeholder="Ex : Rage, Antipuces…"
        returnKeyType="next"
        // Le champ Date n'accepte pas le focus clavier : la chaîne le saute et
        // enchaîne sur Dosage, en suivant l'ordre visuel (PET-7).
        submitBehavior="submit"
        onSubmitEditing={() => dosageRef.current?.focus()}
      />

      <Controller
        control={control}
        name="date"
        render={({ field, fieldState }) => (
          <DateField
            label="Date"
            value={field.value || null}
            onChange={(value) => field.onChange(value ?? '')}
            error={fieldState.error?.message}
            maximumDate={new Date()}
          />
        )}
      />

      <FormField
        control={control}
        name="dosage"
        label="Dosage"
        placeholder="Optionnel"
        inputRef={dosageRef}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => vetRef.current?.focus()}
      />

      <FormField
        control={control}
        name="vet"
        label="Vétérinaire"
        placeholder="Optionnel"
        inputRef={vetRef}
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => notesRef.current?.focus()}
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

      {/* Notes est multiligne : lui faire soumettre le formulaire à la touche
          entrée rendrait impossible la saisie d'une seconde ligne. La chaîne
          clavier s'y termine, la soumission passe par le bouton. */}
      <FormField
        control={control}
        name="notes"
        label="Notes"
        placeholder="Optionnel"
        inputRef={notesRef}
        multiline
      />

      {error && <Text className="text-body text-danger">{error}</Text>}

      <Button label={submitLabel} loading={formState.isSubmitting} onPress={submit} />
    </View>
  );
}
