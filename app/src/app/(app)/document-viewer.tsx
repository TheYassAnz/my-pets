import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon } from '@/components/ui';

export default function DocumentViewerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ title?: string }>();
  const documentTitle = params.title || 'Carnet de santé — Pilou.pdf';

  const handleShare = () => {
    Alert.alert('Partager le document', `Partage de ${documentTitle}`);
  };

  const handleRename = () => {
    Alert.alert('Renommer', 'Saisissez le nouveau nom du document');
  };

  const handleDelete = () => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer définitivement ce document ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <View className="flex-1 bg-[#0f1018]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Barre d'outils supérieure */}
      <View
        style={{ paddingTop: Math.max(insets.top, 20) }}
        className="px-5 pb-3 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={() => router.back()}
          className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20">
          <Icon name="close" size={16} color="#ffffff" decorative />
        </Pressable>

        <Text className="text-[13.5px] font-medium text-neutral-300">2 sur 9</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Partager"
          onPress={handleShare}
          className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:bg-white/20">
          <Icon name="settings" size={16} color="#ffffff" decorative />
        </Pressable>
      </View>

      {/* Titre du document */}
      <View className="px-5 py-1">
        <Text className="text-[13px] text-neutral-400 text-center" numberOfLines={1}>
          {documentTitle}
        </Text>
      </View>

      {/* Feuille de document stylisée (Aperçu Nocturne) */}
      <View className="flex-1 mx-5 my-3 rounded-lg bg-[#e4e7f5] p-6 justify-between overflow-hidden shadow-2xl">
        <View className="gap-2.5">
          <View className="h-2.5 w-[45%] rounded bg-[#9397ab]" />
          <View className="h-2 w-[68%] rounded bg-[#cfd3e5]" />
          <View className="h-[1px] bg-[#cfd3e5] my-2" />
          <View className="h-2 w-[88%] rounded bg-[#cfd3e5]" />
          <View className="h-2 w-[80%] rounded bg-[#cfd3e5]" />
          <View className="h-2 w-[52%] rounded bg-[#cfd3e5]" />
          <View className="h-2 w-[70%] rounded bg-[#cfd3e5] mt-3" />
          <View className="h-2 w-[34%] rounded bg-[#cfd3e5]" />
        </View>

        <View className="items-center py-2">
          <Text className="text-[11px] text-neutral-600 font-mono">
            CLINIQUE VÉTÉRINAIRE DES LILAS · CERTIFICAT VACCINAL
          </Text>
        </View>
      </View>

      {/* Actions inférieures Screen 19 */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
        className="px-5 pt-3 flex-row gap-2.5">
        <Button variant="secondary" size="md" onPress={handleShare} className="flex-1">
          Partager
        </Button>
        <Button variant="secondary" size="md" onPress={handleRename} className="flex-1">
          Renommer
        </Button>
        <Button variant="secondary" size="md" onPress={handleDelete} className="flex-1">
          Supprimer
        </Button>
      </View>
    </View>
  );
}
