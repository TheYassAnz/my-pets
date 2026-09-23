import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Icon } from '@/components/ui';

export default function InvitationScreen() {
  const onAccept = () => {
    router.replace('/(app)');
  };

  const onDecline = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-sunken">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 }}>
        <View>
          {/* Bouton Retour Circulaire */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            className="w-[34px] h-[34px] rounded-full items-center justify-center bg-surface border border-border">
            <Icon name="chevron-left" size={16} color="rgb(var(--color-text))" />
          </Pressable>

          <Text className="text-[26px] font-medium tracking-tight text-text mt-4 mb-4">
            Invitation
          </Text>

          {/* Carte Dégradé Indigo / Accent */}
          <View className="rounded-lg p-4 bg-brand/20 border border-brand/40 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-brand/30">
                <Text className="text-[14px] font-medium text-primary">C</Text>
              </View>
              <Text className="flex-1 text-[14px] leading-snug text-text">
                <Text className="font-semibold">Camille Roux</Text> vous invite dans son foyer
              </Text>
            </View>
            <Text className="text-[13px] text-text-secondary leading-relaxed">
              Vous y entrez comme <Text className="font-medium text-text">aidant</Text> : vous cochez les
              tâches du jour, sans modifier les fiches.
            </Text>
          </View>

          {/* Animaux du foyer */}
          <Text className="text-[10px] font-medium tracking-wider uppercase text-text-tertiary mt-6 mb-2">
            Trois animaux
          </Text>

          <View className="rounded-lg bg-surface border border-border overflow-hidden">
            <View className="flex-row items-center gap-3 p-3.5 border-b border-border/50">
              <Avatar name="Pilou" size={32} />
              <Text className="flex-1 text-[14px] font-medium text-text">Pilou</Text>
              <Text className="text-[12px] text-text-secondary">Berger australien</Text>
            </View>

            <View className="flex-row items-center gap-3 p-3.5 border-b border-border/50">
              <Avatar name="Nala" size={32} />
              <Text className="flex-1 text-[14px] font-medium text-text">Nala</Text>
              <Text className="text-[12px] text-text-secondary">Européen</Text>
            </View>

            <View className="flex-row items-center gap-3 p-3.5">
              <Avatar name="Miso" size={32} />
              <Text className="flex-1 text-[14px] font-medium text-text">Miso</Text>
              <Text className="text-[12px] text-text-secondary">Chaton · 5 mois</Text>
            </View>
          </View>

          <Text className="text-[12px] text-text-tertiary leading-relaxed mt-4">
            Vous pourrez quitter ce foyer à tout moment. Vos données personnelles ne sont pas
            partagées avec les autres membres.
          </Text>
        </View>

        <View className="gap-3 mt-8 mb-4">
          <Button
            label="Rejoindre le foyer"
            variant="primary"
            onPress={onAccept}
          />
          <Button
            label="Refuser"
            variant="ghost"
            onPress={onDecline}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
