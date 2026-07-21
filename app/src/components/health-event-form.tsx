import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Input, SegmentedControl } from '@/components/ui';
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

const TYPE_OPTIONS = EVENT_TYPES.map((t) => ({ value: t, label: EVENT_LABELS[t] }));

export function HealthEventForm({ initial, submitLabel, onSubmit }: Props) {
  const [type, setType] = useState<HealthEventType>(initial?.type ?? 'VACCINE');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [date, setDate] = useState(initial?.date?.slice(0, 10) ?? '');
  const [dosage, setDosage] = useState(initial?.dosage ?? '');
  const [vet, setVet] = useState(initial?.vet ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [nextDueDate, setNextDueDate] = useState(initial?.nextDueDate?.slice(0, 10) ?? '');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [nextDueDateError, setNextDueDateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setTitleError(null);
    setDateError(null);
    setNextDueDateError(null);
    setError(null);

    if (!title.trim()) {
      setTitleError('Titre requis');
      return;
    }
    if (!isValidDate(date)) {
      setDateError('Date requise au format AAAA-MM-JJ');
      return;
    }
    if (nextDueDate && !isValidDate(nextDueDate)) {
      setNextDueDateError('Date de rappel invalide (AAAA-MM-JJ)');
      return;
    }
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
      <SegmentedControl
        options={TYPE_OPTIONS}
        value={type}
        onChange={(value) => setType(value as HealthEventType)}
      />

      <Input
        label="Titre"
        placeholder="Ex : Rage, Antipuces…"
        value={title}
        onChangeText={setTitle}
        error={titleError ?? undefined}
      />
      <Input
        label="Date"
        placeholder="AAAA-MM-JJ"
        autoCapitalize="none"
        value={date}
        onChangeText={setDate}
        error={dateError ?? undefined}
      />
      <Input label="Dosage" placeholder="Optionnel" value={dosage} onChangeText={setDosage} />
      <Input
        label="Vétérinaire"
        placeholder="Optionnel"
        value={vet}
        onChangeText={setVet}
      />
      <Input
        label="Prochain rappel"
        placeholder="AAAA-MM-JJ, optionnel"
        autoCapitalize="none"
        value={nextDueDate}
        onChangeText={setNextDueDate}
        error={nextDueDateError ?? undefined}
      />
      <Input
        label="Notes"
        placeholder="Optionnel"
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      {error && <Text className="text-callout text-danger">{error}</Text>}

      <Button label={submitLabel} loading={submitting} onPress={handleSubmit} />
    </View>
  );
}
