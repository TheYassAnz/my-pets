import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon } from '@/components/ui';
import { api } from '@/lib/api';

export default function NotificationsPermissionScreen() {
  const [loading, setLoading] = useState(false);

  const onRequestPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
        if (tokenData?.data) {
          await api.registerPushToken(tokenData.data).catch(() => null);
        }
      }
    } catch {
      // Ignorer l'erreur pour ne pas bloquer l'onboarding
    } finally {
      setLoading(false);
      router.replace('/(app)');
    }
  };

  const onSkip = () => {
    router.replace('/(app)');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-sunken">
      <View className="flex-1 px-6 py-8 justify-between">
        <View className="mt-4">
          <View className="w-14 h-14 rounded-2xl items-center justify-center bg-brand/20 border border-brand/40 mb-6">
            <Icon name="bell" size={26} color="rgb(var(--color-primary))" />
          </View>

          <Text className="text-[25px] font-medium tracking-tight text-text leading-snug">
            Les rappels, au bon moment
          </Text>

          <Text className="text-[14px] text-text-secondary leading-relaxed mt-2.5">
            Sans notification, un vermifuge se rate. MyPets n'envoie que ce que vous programmez —
            jamais de publicité.
          </Text>

          {/* Exemples de notifications programmées */}
          <View className="gap-2.5 mt-8">
            <View className="flex-row items-center gap-3 p-3.5 rounded-lg bg-surface border border-border">
              <View className="w-8 h-8 rounded-lg items-center justify-center bg-brand/20">
                <Text className="text-[11px] font-medium text-primary">08:00</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[13.5px] font-medium text-text">Vermifuge de Pilou</Text>
                <Text className="text-[11.5px] text-text-secondary mt-0.5">
                  Milbemax · 1 comprimé
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3 p-3.5 rounded-lg bg-surface border border-border">
              <View className="w-8 h-8 rounded-lg items-center justify-center bg-brand/20">
                <Text className="text-[11px] font-medium text-primary">18:00</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[13.5px] font-medium text-text">Vaccin demain 09:30</Text>
                <Text className="text-[11.5px] text-text-secondary mt-0.5">
                  Clinique des Peupliers
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-3 mt-8">
          <Button
            label="Activer les notifications"
            variant="primary"
            loading={loading}
            onPress={onRequestPermission}
          />
          <Button
            label="Plus tard"
            variant="ghost"
            onPress={onSkip}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
