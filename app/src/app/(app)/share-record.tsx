import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, useColorScheme, View } from 'react-native';

import { Button, Icon, Screen } from '@/components/ui';
import { Colors } from '@/constants/theme';

export default function ShareRecordScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [selectedPet, setSelectedPet] = useState('Pilou');
  const [permissions, setPermissions] = useState({
    identity: true,
    health: true,
    docs: false,
  });
  const [duration, setDuration] = useState('7 jours');

  const handleCopyLink = () => {
    Alert.alert('Lien copié !', 'Le lien de partage sécurisé a été copié dans le presse-papier.');
  };

  const handleShare = () => {
    Alert.alert(
      'Partager le carnet',
      `Le carnet de ${selectedPet} est prêt à être partagé avec votre vétérinaire ou pet-sitter.`,
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen scroll contentContainerClassName="pb-36">
        <ScrollView contentContainerClassName="pt-3 px-5">
          {/* Header Screen 26 */}
          <View className="flex-row items-center gap-3 pt-2 pb-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour"
              onPress={() => router.back()}
              className="w-9 h-9 rounded-full border border-border items-center justify-center active:bg-surface-elevated">
              <Icon
                name="chevron"
                size={16}
                color="var(--color-text-secondary)"
                style={{ transform: [{ rotate: '180deg' }] }}
                decorative
              />
            </Pressable>
            <Text className="text-[20px] font-medium text-text tracking-tight">
              Partager le carnet
            </Text>
          </View>

          {/* Section Animal */}
          <View className="mb-4">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-0.5">
              Animal
            </Text>
            <View className="flex-row gap-2">
              {['Pilou', 'Nala', 'Miso'].map((pet) => {
                const isSelected = selectedPet === pet;
                return (
                  <Pressable
                    key={pet}
                    onPress={() => setSelectedPet(pet)}
                    className={`rounded-sm px-3.5 py-1 border ${
                      isSelected
                        ? 'border-brand/70 bg-brand/15'
                        : 'border-border/60 bg-surface'
                    }`}>
                    <Text
                      className={`text-[12.5px] font-medium ${
                        isSelected ? 'text-primary font-semibold' : 'text-text-secondary'
                      }`}>
                      {pet}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Section Ce que voit le destinataire */}
          <View className="mb-4">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-0.5">
              Ce que voit le destinataire
            </Text>
            <View className="rounded-md bg-surface border border-border/40 divide-y divide-border/20 px-4">
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-[13.5px] text-text">Identité et poids</Text>
                <Switch
                  value={permissions.identity}
                  onValueChange={(val) => setPermissions((p) => ({ ...p, identity: val }))}
                  trackColor={{ false: colors.surfaceSunken, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              </View>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-[13.5px] text-text">Vaccins et traitements</Text>
                <Switch
                  value={permissions.health}
                  onValueChange={(val) => setPermissions((p) => ({ ...p, health: val }))}
                  trackColor={{ false: colors.surfaceSunken, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              </View>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-[13.5px] text-text">Documents et factures</Text>
                <Switch
                  value={permissions.docs}
                  onValueChange={(val) => setPermissions((p) => ({ ...p, docs: val }))}
                  trackColor={{ false: colors.surfaceSunken, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              </View>
            </View>
          </View>

          {/* Section Durée d'accès */}
          <View className="mb-5">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-0.5">
              Durée d&apos;accès
            </Text>
            <View className="flex-row bg-surface rounded-full p-1 border border-border/40">
              {(['24 h', '7 jours', '30 jours', 'Illimité'] as const).map((d) => {
                const isSelected = duration === d;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setDuration(d)}
                    className={`flex-1 py-1.5 rounded-full items-center ${
                      isSelected ? 'border border-brand/70 bg-brand/15' : ''
                    }`}>
                    <Text
                      className={`text-[12px] font-medium ${
                        isSelected ? 'text-primary font-semibold' : 'text-text-secondary'
                      }`}>
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Carte QR Code */}
          <View className="p-5 rounded-md bg-surface border border-border/50 items-center gap-3 mb-6 shadow-sm">
            <View className="w-28 h-28 rounded-lg bg-neutral-100 items-center justify-center border border-neutral-300">
              <Text className="text-[11px] font-mono font-bold tracking-widest text-neutral-600 uppercase">
                QR CODE
              </Text>
            </View>
            <Text className="text-[12px] text-text-secondary text-center leading-relaxed">
              À scanner en clinique, ou envoyez le lien.{'\n'}Expire le 17 septembre.
            </Text>
          </View>

          {/* Boutons d'action */}
          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              size="md"
              onPress={handleCopyLink}
              className="flex-1">
              Copier le lien
            </Button>
            <Button
              variant="primary"
              size="md"
              onPress={handleShare}
              className="flex-1">
              Partager
            </Button>
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}
