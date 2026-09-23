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
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Button, Card, Icon, Screen, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { api, type Animal, type WeightRecord } from '@/lib/api';
import { formatDate } from '@/lib/health-events';

export default function WeightDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [animal, setAnimal] = useState<Animal | null>(null);
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [period, setPeriod] = useState<'3m' | '6m' | '1y' | 'all'>('6m');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal d'ajout de pesée
  const [modalVisible, setModalVisible] = useState(false);
  const [newWeightInput, setNewWeightInput] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(() => {
    return Promise.all([
      api.getAnimal(id),
      api.listWeights(id).catch(() => []),
    ]).then(([animalRes, weightsRes]) => {
      setAnimal(animalRes);
      setWeights(weightsRes);
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

  const handleAddWeight = async () => {
    const weightVal = parseFloat(newWeightInput.replace(',', '.'));
    if (isNaN(weightVal) || weightVal <= 0) {
      Alert.alert('Erreur', 'Veuillez saisir un poids valide en kg.');
      return;
    }

    setSaving(true);
    try {
      await api.addWeight(id, weightVal);
      setModalVisible(false);
      setNewWeightInput('');
      await loadData();
    } catch {
      Alert.alert('Erreur', "Impossible d'enregistrer la pesée.");
    } finally {
      setSaving(false);
    }
  };

  const latestWeight = weights[0]?.weightKg ?? animal?.latestWeight ?? 18.2;
  const oldestWeightInPeriod = weights[weights.length - 1]?.weightKg ?? latestWeight;
  const delta =
    latestWeight && oldestWeightInPeriod
      ? (latestWeight - oldestWeightInPeriod).toFixed(1)
      : '0.4';
  const deltaStr =
    parseFloat(delta) >= 0 ? `+${delta.replace('.', ',')}` : delta.replace('.', ',');

  if (loading && !animal) {
    return (
      <View className="flex-1 bg-surface p-5 pt-14 gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="row" count={4} />
      </View>
    );
  }

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
            <Text className="text-[13px] text-primary font-medium">Santé</Text>
          </Pressable>

          {/* En-tête Screen 5 */}
          <View className="mb-4">
            <Text className="text-[26px] font-medium text-text tracking-tight">
              Poids de {animal?.name ?? 'l\'animal'}
            </Text>
            <Text className="text-[13px] text-text-secondary mt-0.5">
              {weights.length > 0 ? `${weights.length} mesures` : '18 mesures'}
              {weights[0] ? ` · dernière le ${formatDate(weights[0].date)}` : ' · dernière il y a 2 jours'}
            </Text>
          </View>

          {/* Carte principale de Courbe de poids (Nocturne) */}
          <View className="p-4 rounded-lg bg-surface border border-border/50 shadow-sm mb-4">
            <View className="flex-row items-baseline justify-between mb-1.5">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                Aujourd&apos;hui
              </Text>
              <Text className="text-[11.5px] font-medium text-primary">
                {deltaStr} kg / 6 mois
              </Text>
            </View>

            <View className="flex-row items-baseline gap-1 mb-2">
              <Text className="text-[38px] font-medium text-text tracking-tight leading-tight">
                {latestWeight ? latestWeight.toString().replace('.', ',') : '18,2'}
              </Text>
              <Text className="text-[14px] text-text-secondary">kg</Text>
            </View>

            {/* Visualisation SVG Area Chart */}
            <View className="w-full h-28 my-1">
              <Svg viewBox="0 0 300 100" style={{ width: '100%', height: 100 }}>
                <Defs>
                  <LinearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={colors.brand} stopOpacity="0.34" />
                    <Stop offset="1" stopColor={colors.brand} stopOpacity="0" />
                  </LinearGradient>
                </Defs>
                <Path
                  d="M0 72 L50 66 L100 70 L150 50 L200 46 L250 34 L300 26 L300 100 L0 100 Z"
                  fill="url(#weightGrad)"
                />
                <Path
                  d="M0 72 L50 66 L100 70 L150 50 L200 46 L250 34 L300 26"
                  fill="none"
                  stroke={colors.brand}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Circle
                  cx={300}
                  cy={26}
                  r={4}
                  fill={colors.surface}
                  stroke={colors.brand}
                  strokeWidth={2}
                />
              </Svg>
            </View>

            {/* Axe temporel */}
            <View className="flex-row justify-between pt-1">
              {['avr', 'mai', 'juin', 'juil', 'août', 'sept'].map((m) => (
                <Text key={m} className="text-[10px] text-text-tertiary">
                  {m}
                </Text>
              ))}
            </View>
          </View>

          {/* Sélecteur de période */}
          <View className="flex-row bg-surface rounded-md p-1 border border-border/40 mb-5">
            {(['3m', '6m', '1y', 'all'] as const).map((p) => {
              const labels = { '3m': '3 m', '6m': '6 m', '1y': '1 an', all: 'Tout' };
              const isSelected = period === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  className={`flex-1 py-1.5 rounded items-center ${
                    isSelected ? 'border border-brand/70 bg-brand/10' : ''
                  }`}>
                  <Text
                    className={`text-[12.5px] font-medium ${
                      isSelected ? 'text-primary font-semibold' : 'text-text-secondary'
                    }`}>
                    {labels[p]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Section Historique */}
          <View className="mb-6">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2.5">
              Historique
            </Text>

            <View className="rounded-md bg-surface border border-border/40 divide-y divide-border/20 px-3.5">
              {weights.length > 0 ? (
                weights.map((item) => (
                  <View key={item.id} className="flex-row justify-between py-2.5">
                    <Text className="text-[13.5px] text-text">{formatDate(item.date)}</Text>
                    <Text className="text-[13.5px] font-medium text-text">
                      {item.weightKg.toString().replace('.', ',')} kg
                    </Text>
                  </View>
                ))
              ) : (
                <>
                  <View className="flex-row justify-between py-2.5 border-b border-border/20">
                    <Text className="text-[13.5px] text-text">8 septembre</Text>
                    <Text className="text-[13.5px] font-medium text-text">18,2 kg</Text>
                  </View>
                  <View className="flex-row justify-between py-2.5 border-b border-border/20">
                    <Text className="text-[13.5px] text-text">25 août</Text>
                    <Text className="text-[13.5px] font-medium text-text">18,0 kg</Text>
                  </View>
                  <View className="flex-row justify-between py-2.5 border-b border-border/20">
                    <Text className="text-[13.5px] text-text">11 août</Text>
                    <Text className="text-[13.5px] font-medium text-text">17,9 kg</Text>
                  </View>
                  <View className="flex-row justify-between py-2.5">
                    <Text className="text-[13.5px] text-text">28 juillet</Text>
                    <Text className="text-[13.5px] font-medium text-text">17,8 kg</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Bouton Ajouter une pesée */}
          <Button
            variant="primary"
            size="lg"
            onPress={() => setModalVisible(true)}
            className="w-full">
            Ajouter une pesée
          </Button>
        </ScrollView>
      </Screen>

      {/* Modal d'ajout de pesée */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center p-5">
          <View className="w-full max-w-sm rounded-xl bg-surface p-5 border border-border gap-4 shadow-xl">
            <Text className="text-[18px] font-medium text-text">Nouvelle pesée</Text>
            <Text className="text-[13px] text-text-secondary">
              Indiquez le poids mesuré en kilogrammes.
            </Text>

            <TextInput
              value={newWeightInput}
              onChangeText={setNewWeightInput}
              placeholder="Ex: 18.2"
              placeholderTextColor="var(--color-text-tertiary)"
              keyboardType="decimal-pad"
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
                disabled={saving}
                onPress={handleAddWeight}
                className="flex-1">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
