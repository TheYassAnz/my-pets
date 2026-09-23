import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Modal, Platform, Pressable, Text, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { formatLongDate, parseIsoDate, toIsoDate } from '@/lib/dates';

import { Button } from './button';
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
  const [draft, setDraft] = useState<Date | null>(null);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const selected = (value ? parseIsoDate(value) : null) ?? new Date();
  const display = value ? formatLongDate(value) : placeholder;

  const handleOpen = () => {
    setDraft(selected);
    setOpen(true);
  };

  const handleValidate = () => {
    if (draft) {
      onChange(toIsoDate(draft));
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
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
          onPress={handleOpen}
          className={`min-h-[56px] flex-1 justify-center rounded-xl px-5 py-4 bg-surface-sunken ${
            error ? 'border-2 border-danger' : 'border-transparent'
          }`}>
          <Text className={`text-headline ${value ? 'text-text' : 'text-text-tertiary'}`}>
            {display}
          </Text>
        </Pressable>

        {clearable && value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Effacer ${label}`}
            onPress={() => onChange(null)}
            className="min-h-11 justify-center px-2">
            <Text className="text-body text-primary">Effacer</Text>
          </Pressable>
        ) : null}
      </View>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={handleCancel}
          accessibilityViewIsModal>
          {/* Backdrop semi-transparent */}
          <Pressable
            onPress={handleCancel}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            className="flex-1 justify-center items-center">
            {/* Carte centrée : absorbe les taps pour éviter la fermeture du backdrop */}
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="w-[90%] max-w-[360px] rounded-2xl bg-surface p-4 gap-3">
              {/* Calendrier */}
              {draft !== null ? (
                <DateTimePicker
                  style={{ width: 320, height: 320, alignSelf: 'center' }}
                  value={draft}
                  mode="date"
                  display="inline"
                  locale="fr_FR"
                  themeVariant={scheme === 'dark' ? 'dark' : 'light'}
                  accentColor={colors.primary}
                  minimumDate={minimumDate}
                  maximumDate={maximumDate}
                  onValueChange={(_event, date) => setDraft(date)}
                />
              ) : null}

              {/* Boutons */}
              <View className="flex-row gap-2 mt-2">
                <View className="flex-1">
                  <Button
                    label="Annuler"
                    variant="ghost"
                    onPress={handleCancel}
                  />
                </View>
                <View className="flex-1">
                  <Button
                    label="Valider"
                    variant="primary"
                    onPress={handleValidate}
                  />
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : (
        /* Android : conserve le comportement natif avec dialogue Material */
        open ? (
          <DateTimePicker
                  style={{ width: 320, height: 320, alignSelf: 'center' }}
            value={selected}
            mode="date"
            display="default"
            locale="fr_FR"
            themeVariant={scheme === 'dark' ? 'dark' : 'light'}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onValueChange={(_event, date) => {
              onChange(toIsoDate(date));
              setOpen(false);
            }}
            onDismiss={() => setOpen(false)}
          />
        ) : null
      )}
    </FieldShell>
  );
}
