import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon } from '@/components/ui';

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface-sunken">
      <View className="flex-1 px-7 py-10 justify-between">
        <View className="mt-8">
          {/* Logo Icône Patte */}
          <View className="w-14 h-14 rounded-2xl items-center justify-center bg-brand/20 border border-brand/40">
            <Icon name="paw" size={28} color="rgb(var(--color-primary))" />
          </View>

          {/* Titre & Accroche */}
          <Text className="text-[38px] font-medium tracking-tight text-text mt-7 leading-tight">
            MyPets
          </Text>
          <Text className="text-[16px] text-text-secondary leading-relaxed mt-3">
            Le carnet de santé de vos chiens et chats, partagé avec ceux qui s'en occupent.
          </Text>

          {/* Points clés */}
          <View className="gap-5 mt-10">
            <View className="flex-row items-start gap-3.5">
              <View className="w-7 h-7 rounded-lg items-center justify-center bg-surface border border-border">
                <Icon name="check" size={15} color="rgb(var(--color-primary))" />
              </View>
              <Text className="flex-1 text-[14px] leading-relaxed text-text">
                Vaccins, vermifuges et traitements — rappelés à l'heure
              </Text>
            </View>

            <View className="flex-row items-start gap-3.5">
              <View className="w-7 h-7 rounded-lg items-center justify-center bg-surface border border-border">
                <Icon name="check" size={15} color="rgb(var(--color-primary))" />
              </View>
              <Text className="flex-1 text-[14px] leading-relaxed text-text">
                Ordonnances et factures, accessibles hors ligne
              </Text>
            </View>

            <View className="flex-row items-start gap-3.5">
              <View className="w-7 h-7 rounded-lg items-center justify-center bg-surface border border-border">
                <Icon name="check" size={15} color="rgb(var(--color-primary))" />
              </View>
              <Text className="flex-1 text-[14px] leading-relaxed text-text">
                À deux ou à plusieurs : chacun voit ce qui est fait
              </Text>
            </View>
          </View>
        </View>

        {/* Boutons d'action */}
        <View className="gap-3 mt-8">
          <Button
            label="Créer mon foyer"
            variant="primary"
            onPress={() => router.push('/sign-up')}
          />
          <Button
            label="J'ai déjà un compte"
            variant="ghost"
            onPress={() => router.push('/sign-in')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
