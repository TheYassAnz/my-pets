import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput as RNTextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Avatar,
  Button,
  DateField,
  FormField,
  Icon,
  SegmentedControl,
  Text,
  useToast,
} from '@/components/ui';
import { api, type HealthEvent, type HealthEventType } from '@/lib/api';
import { toIsoDate } from '@/lib/dates';
import {
  healthEventSchema,
  weightEntrySchema,
  type HealthEventValues,
} from '@/lib/forms/schemas';

type EntryType = HealthEventType | 'WEIGHT';
type EntryValues = Omit<HealthEventValues, 'type'> & { type: EntryType; weightKg: string };

const OPTIONS = [
  { value: 'VACCINE', label: 'Vaccin' },
  { value: 'TREATMENT', label: 'Soin' },
  { value: 'VISIT', label: 'Visite' },
  { value: 'WEIGHT', label: 'Poids' },
];

const SPECIFIC_DEFAULTS = { title: '', dosage: '', vet: '', notes: '', nextDueDate: null, weightKg: '' };

// Le schéma dépend du type choisi : on le résout à chaque validation.
const resolver: Resolver<EntryValues> = (values, context, options) =>
  zodResolver(values.type === 'WEIGHT' ? weightEntrySchema : healthEventSchema)(
    values as never,
    context,
    options as never,
  ) as never;

type Props = {
  animalId: string;
  animal?: { name: string; photoUrl?: string | null };
  /** Présent ⇒ mode édition. */
  event?: HealthEvent;
  onDelete?: () => void;
};

export function EntryForm({ animalId, animal, event, onDelete }: Props) {
  const editing = !!event;
  const { show } = useToast();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);
  const vetRef = useRef<RNTextInput>(null);
  const notesRef = useRef<RNTextInput>(null);

  const { control, handleSubmit, reset, getValues, setValue, formState } =
    useForm<EntryValues>({
      resolver,
      mode: 'onTouched',
      defaultValues: event
        ? {
            type: event.type,
            title: event.title,
            date: event.date.slice(0, 10),
            dosage: event.dosage ?? '',
            vet: event.vet ?? '',
            notes: event.notes ?? '',
            nextDueDate: event.nextDueDate?.slice(0, 10) ?? null,
            weightKg: '',
          }
        : { type: 'VACCINE', date: toIsoDate(new Date()), ...SPECIFIC_DEFAULTS },
    });
  const type = useWatch({ control, name: 'type' });
  const isWeight = type === 'WEIGHT';

  const changeType = (next: string) => {
    if (editing) return setValue('type', next as EntryType);
    // La date saisie est conservée ; les champs propres au type précédent repartent à vide.
    reset({ ...SPECIFIC_DEFAULTS, date: getValues('date'), type: next as EntryType });
    setError(null);
  };

  const submit = handleSubmit(async (values) => {
    setError(null);
    try {
      // `values` est la sortie du schéma choisi : le schéma poids ne renvoie pas `type`.
      const entryType = getValues('type');
      if (event) {
        // Champ visible vidé ⇒ null (le serveur le remet à vide) ; dosage n'est pas éditable ici.
        const vet = values.vet.trim() || null;
        await api.updateEvent(animalId, event.id, {
          type: entryType as HealthEventType,
          title: values.title.trim(),
          date: values.date,
          notes: values.notes.trim() || null,
          ...(entryType === 'VISIT' ? { vet } : { nextDueDate: values.nextDueDate }),
        });
        show('Entrée mise à jour');
      } else if (entryType === 'WEIGHT') {
        // Le résolveur renvoie la sortie du schéma : weightKg est déjà un nombre.
        await api.addWeight(animalId, Number(values.weightKg), values.date);
        show('Entrée ajoutée');
      } else {
        await api.createEvent(animalId, {
          type: entryType,
          title: values.title.trim(),
          date: values.date,
          dosage: values.dosage.trim() || undefined,
          vet: values.vet.trim() || undefined,
          notes: values.notes.trim() || undefined,
          nextDueDate: values.nextDueDate ?? undefined,
        });
        show('Entrée ajoutée');
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible');
    }
  });

  // Verrou synchrone : isSubmitting n'est mis à jour qu'au rendu suivant.
  const send = () => {
    if (sending.current) return;
    sending.current = true;
    submit().finally(() => {
      sending.current = false;
    });
  };

  const isVisit = type === 'VISIT';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 12 }}
        contentContainerClassName="gap-5 px-5 pb-6">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full bg-surface-sunken">
          <Icon name="chevron-back" size={22} decorative />
        </Pressable>

        <Text className="text-[30px] font-extrabold text-text">{editing ? 'Modifier l\'entrée' : 'Nouvelle entrée'}</Text>

        {animal ? (
          <View className="flex-row items-center gap-2">
            <Avatar size="xs" uri={animal.photoUrl} />
            <Text className="text-body text-text-secondary">Pour {animal.name}</Text>
          </View>
        ) : null}

        <SegmentedControl options={editing ? OPTIONS.filter((o) => o.value !== 'WEIGHT') : OPTIONS} value={type} onChange={changeType} />

        <Controller
          control={control}
          name="date"
          render={({ field, fieldState }) => (
            <DateField
              label="Date"
              value={field.value || null}
              onChange={(v) => field.onChange(v ?? '')}
              error={fieldState.error?.message}
              maximumDate={isWeight ? new Date() : undefined}
            />
          )}
        />

        {isWeight ? (
          <FormField
            control={control}
            name="weightKg"
            label="Poids (kg)"
            placeholder="Ex : 4,2"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={send}
          />
        ) : (
          <>
            <FormField
              control={control}
              name="title"
              label={isVisit ? 'Motif' : 'Produit'}
              placeholder={isVisit ? 'Ex : Contrôle annuel' : 'Ex : Rage, Antipuces'}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => (isVisit ? vetRef.current : notesRef.current)?.focus()}
            />
            {isVisit ? (
              <FormField
                control={control}
                name="vet"
                label="Vétérinaire"
                placeholder="Facultatif"
                inputRef={vetRef}
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => notesRef.current?.focus()}
              />
            ) : (
              <Controller
                control={control}
                name="nextDueDate"
                render={({ field, fieldState }) => (
                  <DateField
                    label="Prochaine échéance"
                    placeholder="Facultatif"
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    clearable
                  />
                )}
              />
            )}
            {/* Multiligne : la touche entrée ajoute une ligne, la soumission passe par le bouton. */}
            <FormField
              control={control}
              name="notes"
              label="Note"
              placeholder="Facultatif"
              inputRef={notesRef}
              multiline
            />
          </>
        )}

        {error ? (
          <Text accessibilityRole="alert" className="text-body text-danger">
            {error}
          </Text>
        ) : null}

        {onDelete ? <Button label="Supprimer" variant="destructive" icon="trash" onPress={onDelete} /> : null}
      </ScrollView>

      <View className="bg-surface px-5 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button label="Enregistrer" loading={formState.isSubmitting} onPress={send} />
      </View>
    </KeyboardAvoidingView>
  );
}
