import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import type { HealthEventInput, HealthEventType } from '@/lib/api';
import { EVENT_LABELS, EVENT_TYPES } from '@/lib/health-events';

type Props = {
  initial?: Partial<HealthEventInput>;
  submitLabel: string;
  onSubmit: (input: HealthEventInput) => Promise<void>;
};

// Validation légère d'une date saisie au format AAAA-MM-JJ
function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
}

export function HealthEventForm({ initial, submitLabel, onSubmit }: Props) {
  const [type, setType] = useState<HealthEventType>(initial?.type ?? 'VACCINE');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [date, setDate] = useState(initial?.date?.slice(0, 10) ?? '');
  const [dosage, setDosage] = useState(initial?.dosage ?? '');
  const [vet, setVet] = useState(initial?.vet ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [nextDueDate, setNextDueDate] = useState(initial?.nextDueDate?.slice(0, 10) ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Titre requis');
      return;
    }
    if (!isValidDate(date)) {
      setError('Date requise au format AAAA-MM-JJ');
      return;
    }
    if (nextDueDate && !isValidDate(nextDueDate)) {
      setError('Date de rappel invalide (AAAA-MM-JJ)');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        date,
        dosage: dosage.trim() || undefined,
        vet: vet.trim() || undefined,
        notes: notes.trim() || undefined,
        nextDueDate: nextDueDate || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="gap-4">
      <View className="flex-row gap-2">
        {EVENT_TYPES.map((t) => (
          <Pressable
            key={t}
            className={`flex-1 rounded-xl border py-2 items-center ${
              type === t
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300 dark:border-gray-700'
            }`}
            onPress={() => setType(t)}>
            <Text
              className={
                type === t ? 'text-white font-semibold' : 'text-black dark:text-white'
              }>
              {EVENT_LABELS[t]}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Titre (ex: Rage, Antipuces...)"
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Date (AAAA-MM-JJ)"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        value={date}
        onChangeText={setDate}
      />
      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Dosage (optionnel)"
        placeholderTextColor="#9ca3af"
        value={dosage}
        onChangeText={setDosage}
      />
      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Vétérinaire (optionnel)"
        placeholderTextColor="#9ca3af"
        value={vet}
        onChangeText={setVet}
      />
      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Prochain rappel (AAAA-MM-JJ, optionnel)"
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
        value={nextDueDate}
        onChangeText={setNextDueDate}
      />
      <TextInput
        className="rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-black dark:text-white"
        placeholder="Notes (optionnel)"
        placeholderTextColor="#9ca3af"
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      {error && <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>}

      <Pressable
        className="rounded-xl bg-blue-600 py-3 items-center active:opacity-80 disabled:opacity-50"
        disabled={submitting}
        onPress={handleSubmit}>
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}
