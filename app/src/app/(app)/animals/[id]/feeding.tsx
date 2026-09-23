import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import { Button, Card, Icon, Screen, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { api, type Animal, type AnimalWithUpcoming } from '@/lib/api';
import { formatDate } from '@/lib/health-events';

export default function FeedingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [allAnimals, setAllAnimals] = useState<AnimalWithUpcoming[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal d'édition de ration
  const [modalVisible, setModalVisible] = useState(false);
  const [newRation, setNewRation] = useState('');

  const loadData = useCallback(() => {
    return Promise.all([
      api.getAnimal(id),
      api.listAnimals().catch(() => []),
    ]).then(([animalRes, allRes]) => {
      setAnimal(animalRes);
      setAllAnimals(allRes);
      setLoading(false);
    });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const handleUpdateRation = async () => {
    if (!newRation.trim()) return;
    try {
      await api.updateAnimal(id, { dailyRation: newRation });
      setModalVisible(false);
      setNewRation('');
      await loadData();
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour la ration.');
    }
  };

  if (loading && !animal) {
    return (
      <View className="flex-1 bg-surface p-5 pt-14 gap-4">
        <Skeleton variant="card" count={2} />
      </View>
    );
  }

  const otherAnimals = allAnimals.filter((a) => a.id !== id);
  const totalRationStr = animal?.dailyRation ?? '340 g';
  const foodBrand = animal?.foodBrand ?? 'Croquettes adulte agneau';
  const stockKg = animal?.foodStockKg ?? 6.5;
  const totalKg = animal?.foodTotalKg ?? 12.0;
  const stockPercentage = Math.min(100, Math.max(0, Math.round((stockKg / totalKg) * 100)));

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen scroll contentContainerClassName="pb-36">
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerClassName="pt-3 px-5">
          {/* Navigation retour */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            className="flex-row items-center gap-1 pt-2 pb-3 active:opacity-75">
            <Icon
              name="chevron"
              size={16}
              color={colors.primary}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
            <Text className="text-[13px] text-primary font-medium">
              {animal?.name ?? 'Animal'}
            </Text>
          </Pressable>

          {/* En-tête Screen 8 */}
          <View className="mb-4">
            <Text className="text-[26px] font-medium text-text tracking-tight">Alimentation</Text>
            <Text className="text-[13px] text-text-secondary mt-0.5">
              {totalRationStr} par jour, en deux repas
            </Text>
          </View>

          {/* Cartes Repas Matin / Soir */}
          <View className="flex-row gap-2.5 mb-4">
            <View className="flex-1 p-3.5 rounded-md bg-surface border border-border/50 shadow-sm">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                Matin
              </Text>
              <Text className="text-[22px] font-medium text-text mt-1">170 g</Text>
              <Text className="text-[11px] text-text-secondary mt-0.5">07:30 · fait</Text>
            </View>

            <View className="flex-1 p-3.5 rounded-md bg-surface border border-border/50 shadow-sm">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                Soir
              </Text>
              <Text className="text-[22px] font-medium text-text mt-1">170 g</Text>
              <Text className="text-[11px] font-medium text-primary mt-0.5">19:00 · à venir</Text>
            </View>
          </View>

          {/* Carte Type d'aliment */}
          <View className="flex-row items-center gap-3.5 p-3.5 rounded-lg bg-surface border border-border/50 shadow-sm mb-4">
            <View className="w-13 h-13 rounded-md bg-surface-sunken border border-border/60 items-center justify-center p-3">
              <Text className="text-[9px] font-bold text-text-secondary uppercase">Photo</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-medium text-text">{foodBrand}</Text>
              <Text className="text-[12px] text-text-secondary mt-0.5">
                Sac de {totalKg} kg · ouvert le{' '}
                {animal?.foodOpenedAt ? formatDate(animal.foodOpenedAt) : '20 août'}
              </Text>
            </View>
          </View>

          {/* Jauge de Stock restant */}
          <View className="p-4 rounded-lg bg-surface border border-border/50 shadow-sm gap-2 mb-5">
            <View className="flex-row justify-between items-baseline">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                Stock restant
              </Text>
              <Text className="text-[12px] text-text-secondary">
                ≈ {Math.round((stockKg * 1000) / 340)} jours
              </Text>
            </View>

            <View className="h-2 rounded-full bg-surface-sunken overflow-hidden my-1">
              <View
                style={{ width: `${stockPercentage}%` }}
                className="h-full bg-primary rounded-full"
              />
            </View>

            <Text className="text-[11px] text-text-secondary">
              {stockKg} kg sur {totalKg} kg · rappel de commande le 24 sept
            </Text>
          </View>

          {/* Section Rations des autres */}
          <View className="mb-5">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2.5 pl-0.5">
              Rations des autres
            </Text>

            <View className="rounded-md bg-surface border border-border/40 divide-y divide-border/20 px-3.5">
              {otherAnimals.length > 0 ? (
                otherAnimals.map((other) => (
                  <View key={other.id} className="flex-row justify-between py-2.5">
                    <Text className="text-[13.5px] text-text">
                      {other.name} · {other.species}
                    </Text>
                    <Text className="text-[13px] text-text-secondary">
                      {other.dailyRation ?? '65 g / j'}
                    </Text>
                  </View>
                ))
              ) : (
                <>
                  <View className="flex-row justify-between py-2.5 border-b border-border/20">
                    <Text className="text-[13.5px] text-text">Nala · pâtée + croquettes</Text>
                    <Text className="text-[13px] text-text-secondary">65 g / j</Text>
                  </View>
                  <View className="flex-row justify-between py-2.5">
                    <Text className="text-[13.5px] text-text">Miso · croquettes chaton</Text>
                    <Text className="text-[13px] text-text-secondary">80 g / j</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Bouton Modifier la ration */}
          <Button
            variant="primary"
            size="lg"
            onPress={() => setModalVisible(true)}
            className="w-full">
            Modifier la ration
          </Button>
        </ScrollView>
      </Screen>

      {/* Modal d'édition de ration */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-5">
          <View className="w-full max-w-sm rounded-xl bg-surface p-5 border border-border gap-4 shadow-xl">
            <Text className="text-[18px] font-medium text-text">Modifier la ration</Text>
            <Text className="text-[13px] text-text-secondary">
              Indiquez la nouvelle ration quotidienne (ex: 340 g).
            </Text>

            <TextInput
              value={newRation}
              onChangeText={setNewRation}
              placeholder="Ex: 350 g"
              placeholderTextColor="var(--color-text-tertiary)"
              autoFocus
              className="h-11 rounded-md bg-surface-elevated px-3.5 text-body text-text border border-border"
            />

            <View className="flex-row gap-2.5 mt-2">
              <Button
                variant="secondary"
                size="md"
                onPress={() => setModalVisible(false)}
                className="flex-1">
                Annuler
              </Button>
              <Button
                variant="primary"
                size="md"
                onPress={handleUpdateRation}
                className="flex-1">
                Enregistrer
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
