import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, Text, useColorScheme, View } from 'react-native';

import { formatLongDate, parseIsoDate, toIsoDate } from '@/lib/dates';

import { FieldShell } from './field-shell';

export type DateFieldProps = {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  error?: string;
  placeholder?: string;
  /** Affiche une action « Effacer » : requis pour la date de rappel, optionnelle. */
  clearable?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DateField({
  label,
  value,
  onChange,
  error,
  placeholder = 'Choisir une date',
  clearable = false,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const scheme = useColorScheme();

  const selected = (value ? parseIsoDate(value) : null) ?? new Date();
  const display = value ? formatLongDate(value) : placeholder;

  const commit = (date: Date) => {
    setOpen(false);
    onChange(toIsoDate(date));
  };

  return (
    <FieldShell label={label} error={error}>
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            error
              ? `${label}, ${value ? formatLongDate(value) : 'aucune date'}, erreur : ${error}`
              : `${label}, ${value ? formatLongDate(value) : 'aucune date'}`
          }
          onPress={() => setOpen(true)}
          className={`min-h-11 flex-1 justify-center rounded-md border px-4 py-3 bg-surface ${
            error ? 'border-danger' : 'border-border'
          }`}>
          <Text className={`text-body ${value ? 'text-text' : 'text-text-tertiary'}`}>
            {display}
          </Text>
        </Pressable>

        {clearable && value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Effacer ${label}`}
            onPress={() => onChange(null)}
            className="min-h-11 justify-center px-2">
            <Text className="text-callout text-primary">Effacer</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Android présente le sélecteur en boîte de dialogue : le composant doit
          être monté à l'ouverture puis démonté à la réponse. iOS l'affiche en
          calendrier sous le champ, refermé dès qu'une date est choisie. */}
      {open ? (
        <DateTimePicker
          value={selected}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          locale="fr_FR"
          themeVariant={scheme === 'dark' ? 'dark' : 'light'}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onValueChange={(_event, date) => commit(date)}
          onDismiss={() => setOpen(false)}
        />
      ) : null}
    </FieldShell>
  );
}
