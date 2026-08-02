import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import { SPECIES, type Species } from '@/lib/animals';

import { FieldShell } from './field-shell';
import type { SpeciesPickerProps } from './species-picker';

// `@expo/ui/community/picker` fige `pickerStyle('wheel')` sur iOS : une roue
// dépliée en permanence, qui occuperait ~200pt dans un formulaire de trois
// champs. On s'adresse donc directement à SwiftUI pour obtenir un menu
// déroulant, cohérent avec le dropdown Material 3 côté Android.
export function SpeciesPicker({ label, value, onChange, error }: SpeciesPickerProps) {
  return (
    <FieldShell label={label} error={error}>
      <Host matchContents={{ vertical: true }} style={{ minHeight: 44 }}>
        <Picker
          selection={value}
          onSelectionChange={(selected) => onChange(selected as Species)}
          modifiers={[pickerStyle('menu')]}>
          {SPECIES.map((species) => (
            <Text key={species} modifiers={[tag(species)]}>
              {species}
            </Text>
          ))}
        </Picker>
      </Host>
    </FieldShell>
  );
}
