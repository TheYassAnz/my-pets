import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, useColorScheme, View } from 'react-native';

import { Icon, Screen } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { useSession } from '@/lib/auth-context';

export default function AccountDataScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user } = useSession();

  const [offlineDocs, setOfflineDocs] = useState(true);

  const handleExport = () => {
    Alert.alert(
      'Export des données',
      'Votre archive complète (Carnet_Sante_Export.zip) comprenant les fiches médicales et les documents PDF est prête pour le téléchargement.',
    );
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Quitter le foyer',
      'Êtes-vous sûr de vouloir quitter le foyer ? Vos animaux resteront accessibles aux autres membres.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Quitter', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données personnelles seront définitivement effacées sous 30 jours.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer définitivement', style: 'destructive', onPress: () => router.back() },
      ],
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen scroll contentContainerClassName="pb-36">
        <ScrollView contentContainerClassName="pt-3 px-5">
          {/* Header Screen 25 */}
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
              Compte et données
            </Text>
          </View>

          {/* Section Identifiants */}
          <View className="mb-4">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-0.5">
              Identifiants
            </Text>
            <View className="rounded-md bg-surface border border-border/40 divide-y divide-border/20 px-4">
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-[14px] text-text">E-mail</Text>
                <Text className="text-[13px] text-text-secondary">
                  {user?.email ?? 'camille.roux@mail.fr'}
                </Text>
              </View>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-[14px] text-text">Mot de passe</Text>
                <Text className="text-[13px] text-text-secondary">Modifié il y a 4 mois</Text>
              </View>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-[14px] text-text">Double authentification</Text>
                <Text className="text-[13px] text-text-secondary">Désactivée</Text>
              </View>
            </View>
          </View>

          {/* Section Vos données */}
          <View className="mb-4">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-0.5">
              Vos données
            </Text>
            <View className="rounded-md bg-surface border border-border/40 divide-y divide-border/20 px-4">
              <Pressable onPress={handleExport} className="py-3 active:opacity-75">
                <Text className="text-[14px] font-medium text-text">Exporter le carnet</Text>
                <Text className="text-[11.5px] text-text-secondary mt-0.5">
                  PDF imprimable ou archive CSV + documents
                </Text>
              </Pressable>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-[14px] text-text">Stockage utilisé</Text>
                <Text className="text-[13px] text-text-secondary">148 Mo · 23 documents</Text>
              </View>
              <View className="flex-row items-center justify-between py-3">
                <Text className="text-[14px] text-text">Documents hors ligne</Text>
                <Switch
                  value={offlineDocs}
                  onValueChange={setOfflineDocs}
                  trackColor={{ false: colors.surfaceSunken, true: colors.brand }}
                  thumbColor={colors.surface}
                />
              </View>
            </View>
          </View>

          {/* Section Zone sensible */}
          <View className="mb-6">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-0.5">
              Zone sensible
            </Text>
            <View className="gap-2.5">
              <Pressable
                onPress={handleLeaveHousehold}
                className="flex-row items-center justify-between p-3.5 rounded-md bg-surface border border-border/50 active:bg-surface-sunken">
                <Text className="text-[14px] text-text">Quitter le foyer</Text>
                <Text className="text-[11.5px] text-text-tertiary">Vos animaux restent au foyer</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteAccount}
                className="p-3.5 rounded-md border border-red-500/30 bg-red-500/5 active:bg-red-500/10">
                <Text className="text-[14px] font-medium text-red-400">
                  Supprimer mon compte
                </Text>
                <Text className="text-[11.5px] text-red-400/80 mt-1 leading-relaxed">
                  Efface le foyer, les 3 fiches et les documents sous 30 jours.
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}
