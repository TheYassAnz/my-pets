import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Checkbox, Icon, Screen } from '@/components/ui';

export default function AppointmentDetailScreen() {
  const params = useLocalSearchParams<{
    title?: string;
    date?: string;
    animal?: string;
  }>();

  const title = params.title || 'Rappel vaccin';
  const animalName = params.animal || 'Pilou';

  const [items, setItems] = useState([
    { id: '1', label: 'Carnet de vaccination', checked: true, hasPdf: false },
    { id: '2', label: 'Ordonnance du 3 août', checked: false, hasPdf: true },
  ]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)),
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Annuler le rendez-vous',
      'Êtes-vous sûr de vouloir annuler ce rendez-vous vétérinaire ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen scroll contentContainerClassName="pb-24">
        <ScrollView contentContainerClassName="pt-3 px-5">
          {/* Header Screen 18 */}
          <View className="flex-row items-center justify-between pt-2 pb-4">
            <View className="flex-row items-center gap-3">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retour à l'agenda"
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
              <Text className="text-[15px] font-medium text-text-secondary">Agenda</Text>
            </View>

            <Pressable onPress={() => Alert.alert('Modifier', 'Modifier le rendez-vous')}>
              <Text className="text-[13px] font-medium text-primary">Modifier</Text>
            </Pressable>
          </View>

          {/* Carte Principale Nocturne */}
          <View
            style={{ backgroundColor: '#1d2042' }}
            className="p-5 rounded-lg border border-border/40 mb-4 shadow-sm">
            <Text className="text-[10px] uppercase tracking-wider font-semibold text-primary">
              Dans 4 jours
            </Text>
            <Text className="text-[24px] font-medium text-white tracking-tight mt-1">
              {title}
            </Text>
            <Text className="text-[14px] text-text-secondary mt-0.5">
              Lundi 14 septembre · 09:30 — 10:00
            </Text>

            <View className="flex-row items-center gap-2.5 mt-4 pt-2 border-t border-white/10">
              <View className="w-7 h-7 rounded-full bg-brand/30 items-center justify-center">
                <Text className="text-[11px] font-bold text-primary">
                  {animalName[0]?.toUpperCase()}
                </Text>
              </View>
              <Text className="text-[13.5px] text-white">
                {animalName} · Berger australien, 7 ans
              </Text>
            </View>
          </View>

          {/* Clinique */}
          <View className="rounded-md bg-surface border border-border/50 overflow-hidden mb-4 shadow-sm">
            <View className="p-4 border-b border-border/30">
              <Text className="text-[14px] font-medium text-text">Clinique des Peupliers</Text>
              <Text className="text-[12.5px] text-text-secondary mt-0.5">
                Dr Vasseur · 14 rue des Peupliers, Lyon 7e
              </Text>
            </View>
            <View className="flex-row divide-x divide-border/30">
              <Pressable
                onPress={() => Linking.openURL('tel:0478224109')}
                className="flex-1 py-3 items-center justify-center active:bg-surface-elevated">
                <Text className="text-[13px] font-medium text-primary">Appeler</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Linking.openURL(
                    'https://maps.apple.com/?q=Clinique+des+Peupliers+Lyon+7',
                  )
                }
                className="flex-1 py-3 items-center justify-center active:bg-surface-elevated">
                <Text className="text-[13px] font-medium text-primary">Itinéraire</Text>
              </Pressable>
            </View>
          </View>

          {/* Section "À apporter" */}
          <View className="mb-4">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2.5">
              À apporter
            </Text>
            <View className="gap-2">
              {items.map((it) => (
                <View
                  key={it.id}
                  className="flex-row items-center gap-3 p-3.5 rounded-md bg-surface border border-border/50">
                  <Checkbox
                    variant="round"
                    checked={it.checked}
                    onCheckedChange={() => toggleItem(it.id)}
                  />
                  <Text
                    className={`flex-1 text-[13.5px] font-medium ${
                      it.checked ? 'text-text-tertiary line-through' : 'text-text'
                    }`}>
                    {it.label}
                  </Text>
                  {it.hasPdf && (
                    <View className="rounded-sm bg-surface-sunken px-2 py-0.5 border border-border/60">
                      <Text className="text-[10px] font-bold text-text-secondary">PDF</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Note */}
          <View className="mb-6">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-1.5">
              Note
            </Text>
            <Text className="text-[13px] text-text-secondary leading-relaxed">
              Signaler la boiterie de la patte arrière gauche apparue après la promenade du 2
              septembre.
            </Text>
          </View>

          {/* Actions du bas */}
          <View className="flex-row gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              onPress={() => Alert.alert('Déplacer', 'Choisir une nouvelle date')}
              className="flex-1">
              Déplacer
            </Button>
            <Pressable
              onPress={handleCancel}
              className="flex-1 py-2.5 rounded-md border border-red-500/40 items-center justify-center active:bg-red-500/10">
              <Text className="text-[14px] font-medium text-red-400">Annuler le rdv</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}
