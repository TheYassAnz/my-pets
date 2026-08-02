import { Picker } from '@expo/ui/community/picker';

import { SPECIES, type Species } from '@/lib/animals';

import { FieldShell } from './field-shell';

export type SpeciesPickerProps = {
  label: string;
  value: Species;
  onChange: (value: Species) => void;
  error?: string;
};

// Variante par défaut : menu déroulant Material 3 sur Android, `<select>` natif
// sur web. iOS est traité dans `species-picker.ios.tsx`, la variante commune y
// imposant une roue dépliée en permanence.
export function SpeciesPicker({ label, value, onChange, error }: SpeciesPickerProps) {
  return (
    <FieldShell label={label} error={error}>
      <Picker
        selectedValue={value}
        onValueChange={(selected) => onChange(selected as Species)}
        style={{ minHeight: 44 }}>
        {SPECIES.map((species) => (
          <Picker.Item key={species} label={species} value={species} />
        ))}
      </Picker>
    </FieldShell>
  );
}
