import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, Icon } from '@/components/ui';

export type EmptyHouseholdProps = {
  userName?: string;
  onAddAnimal?: () => void;
  onJoinHousehold?: () => void;
};

export function EmptyHousehold({
  userName = 'Camille',
  onAddAnimal,
  onJoinHousehold,
}: EmptyHouseholdProps) {
  const todayFormatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const capitalizedDate =
    todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <View className="flex-1 px-6 pt-6 pb-12 justify-between">
      <View>
        <Text className="text-[11px] font-medium tracking-wider uppercase text-text-tertiary">
          {capitalizedDate}
        </Text>
        <Text className="text-[26px] font-medium tracking-tight text-text mt-1">
          Bonjour {userName}
        </Text>
      </View>

      <View className="items-center text-center px-4 my-auto">
        <View className="w-16 h-16 rounded-full items-center justify-center bg-surface border border-border mb-4">
          <Icon name="paw" size={32} color="rgb(var(--color-text-secondary))" />
        </View>

        <Text className="text-[18px] font-medium text-text text-center">
          Votre foyer est vide
        </Text>
        <Text className="text-[13.5px] text-text-secondary leading-relaxed text-center mt-2.5 max-w-[260px]">
          Ajoutez un premier animal : sa fiche, ses rappels et son carnet de santé se construisent
          ensuite au fil des jours.
        </Text>

        <Button
          label="Ajouter un animal"
          variant="primary"
          className="mt-6 w-full"
          onPress={onAddAnimal ?? (() => router.push('/animals/new'))}
        />

        <Button
          label="Rejoindre un foyer existant"
          variant="ghost"
          className="mt-2"
          onPress={onJoinHousehold ?? (() => router.push('/invitation'))}
        />
      </View>
    </View>
  );
}
