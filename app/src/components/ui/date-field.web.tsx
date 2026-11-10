import { Pressable, View } from 'react-native';

import { toIsoDate } from '@/lib/dates';

import type { DateFieldProps } from './date-field';
import { FieldShell } from './field-shell';
import { Text } from './text';

// Web : sélecteur de date natif du navigateur. La valeur est déjà au format AAAA-MM-JJ.
export function DateField({
  label,
  value,
  onChange,
  error,
  clearable = false,
  minimumDate,
  maximumDate,
}: DateFieldProps) {
  return (
    <FieldShell label={label} error={error}>
      <View className="flex-row items-center gap-2">
        <input
          type="date"
          aria-label={error ? `${label}, erreur : ${error}` : label}
          aria-invalid={error ? true : undefined}
          value={value ?? ''}
          min={minimumDate ? toIsoDate(minimumDate) : undefined}
          max={maximumDate ? toIsoDate(maximumDate) : undefined}
          onChange={(e) => onChange(e.target.value || null)}
          className={`min-h-11 flex-1 bg-transparent pb-2.5 pt-1 text-[18px] font-semibold text-text outline-none focus:border-b-2 focus:border-text ${
            error ? 'border-b-[1.5px] border-danger' : 'border-b-[1.5px] border-border'
          }`}
        />
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
    </FieldShell>
  );
}
