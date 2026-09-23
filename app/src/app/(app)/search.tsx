import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';

import { Icon, Screen } from '@/components/ui';
import { Colors } from '@/constants/theme';

type SearchCategory = 'all' | 'animals' | 'documents' | 'appointments' | 'treatments';

export default function GlobalSearchScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [query, setQuery] = useState('vermi');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');

  const recentSearches = ['vaccin rage', 'facture juillet', 'poids Miso'];

  const categories: { key: SearchCategory; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'animals', label: 'Animaux' },
    { key: 'documents', label: 'Documents' },
    { key: 'appointments', label: 'Rendez-vous' },
    { key: 'treatments', label: 'Traitements' },
  ];

  // Base de données simulée pour la recherche globale
  const treatmentsData = [
    {
      id: 't1',
      title: 'Vermifuge du mois',
      subtitle: 'Milbemax · tous les mois · actif',
      animal: 'Pilou',
    },
    {
      id: 't2',
      title: 'Vermifuge chaton',
      subtitle: 'Milprazan · terminé le 12 août',
      animal: 'Miso',
    },
  ];

  const documentsData = [
    {
      id: 'd1',
      title: 'Ordonnance vermifuge',
      subtitle: '3 août 2026 · PDF',
    },
  ];

  const animalsData = [
    { id: 'a1', name: 'Pilou', breed: 'Berger australien' },
    { id: 'a2', name: 'Nala', breed: 'Chat européen' },
    { id: 'a3', name: 'Miso', breed: 'Chartreux' },
  ];

  const appointmentsData = [
    { id: 'e1', title: 'Rappel vaccin CHPL', date: '14 sept 2026', animal: 'Pilou' },
  ];

  // Filtrage selon la requête
  const q = query.trim().toLowerCase();

  const filteredTreatments = useMemo(() => {
    if (!q) return treatmentsData;
    return treatmentsData.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.animal.toLowerCase().includes(q),
    );
  }, [q]);

  const filteredDocuments = useMemo(() => {
    if (!q) return documentsData;
    return documentsData.filter(
      (d) => d.title.toLowerCase().includes(q) || d.subtitle.toLowerCase().includes(q),
    );
  }, [q]);

  const filteredAnimals = useMemo(() => {
    if (!q) return animalsData;
    return animalsData.filter(
      (a) => a.name.toLowerCase().includes(q) || a.breed.toLowerCase().includes(q),
    );
  }, [q]);

  const filteredAppointments = useMemo(() => {
    if (!q) return appointmentsData;
    return appointmentsData.filter(
      (e) => e.title.toLowerCase().includes(q) || e.animal.toLowerCase().includes(q),
    );
  }, [q]);

  const showTreatments =
    (activeCategory === 'all' || activeCategory === 'treatments') &&
    filteredTreatments.length > 0;
  const showDocuments =
    (activeCategory === 'all' || activeCategory === 'documents') &&
    filteredDocuments.length > 0;
  const showAnimals =
    (activeCategory === 'all' || activeCategory === 'animals') &&
    filteredAnimals.length > 0;
  const showAppointments =
    (activeCategory === 'all' || activeCategory === 'appointments') &&
    filteredAppointments.length > 0;

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen scroll contentContainerClassName="pb-36">
        <ScrollView contentContainerClassName="pt-3 px-5">
          {/* Barre de recherche Screen 21 */}
          <View className="flex-row items-center gap-3 pt-2 pb-4">
            <View className="flex-1 flex-row items-center gap-2.5 px-3 py-2.5 rounded-md bg-surface border border-brand shadow-sm">
              <Icon name="search" size={16} color={colors.textTertiary} decorative />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher..."
                placeholderTextColor="var(--color-text-tertiary)"
                autoFocus
                className="flex-1 text-[14px] text-text p-0"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')}>
                  <Icon name="close" size={16} color={colors.textTertiary} decorative />
                </Pressable>
              )}
            </View>

            <Pressable onPress={() => router.back()} className="active:opacity-75">
              <Text className="text-[14px] font-medium text-primary">Annuler</Text>
            </Pressable>
          </View>

          {/* Filtres de catégories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pb-4">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setActiveCategory(cat.key)}
                  className={`rounded-sm px-3 py-1 border ${
                    isSelected
                      ? 'border-brand/70 bg-brand/15'
                      : 'border-border/60 bg-surface'
                  }`}>
                  <Text
                    className={`text-[12px] font-medium ${
                      isSelected ? 'text-primary font-semibold' : 'text-text-secondary'
                    }`}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Résultats : Traitements */}
          {showTreatments && (
            <View className="mb-4">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-0.5">
                Traitements · {filteredTreatments.length}
              </Text>
              <View className="gap-2">
                {filteredTreatments.map((t) => (
                  <View
                    key={t.id}
                    className="flex-row items-center gap-3 p-3.5 rounded-md bg-surface border border-border/50 shadow-sm">
                    <View className="w-7 h-7 rounded-md bg-brand/20 items-center justify-center">
                      <Icon name="treatment" size={14} color={colors.primary} decorative />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[13.5px] font-medium text-text">{t.title}</Text>
                      <Text className="text-[11.5px] text-text-secondary mt-0.5">
                        {t.subtitle}
                      </Text>
                    </View>
                    <View className="rounded-sm bg-surface-sunken px-2 py-0.5 border border-border/60">
                      <Text className="text-[11px] text-text-secondary font-medium">
                        {t.animal}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Résultats : Documents */}
          {showDocuments && (
            <View className="mb-4">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-0.5">
                Documents · {filteredDocuments.length}
              </Text>
              <View className="gap-2">
                {filteredDocuments.map((d) => (
                  <Pressable
                    key={d.id}
                    onPress={() =>
                      router.push({
                        pathname: '/document-viewer',
                        params: { title: d.title },
                      })
                    }
                    className="active:opacity-80">
                    <View className="flex-row items-center gap-3 p-3.5 rounded-md bg-surface border border-border/50 shadow-sm">
                      <View className="w-7 h-8 rounded bg-surface-sunken border border-border items-center justify-center">
                        <Icon name="document" size={14} color={colors.textSecondary} decorative />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13.5px] font-medium text-text">{d.title}</Text>
                        <Text className="text-[11.5px] text-text-secondary mt-0.5">
                          {d.subtitle}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Résultats : Animaux */}
          {showAnimals && (
            <View className="mb-4">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-2 pl-0.5">
                Animaux · {filteredAnimals.length}
              </Text>
              <View className="gap-2">
                {filteredAnimals.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => router.push(`/animals/${a.id}`)}
                    className="active:opacity-80">
                    <View className="flex-row items-center gap-3 p-3.5 rounded-md bg-surface border border-border/50 shadow-sm">
                      <View className="w-7 h-7 rounded-full bg-brand/20 items-center justify-center">
                        <Text className="text-[11px] font-bold text-primary">
                          {a.name[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13.5px] font-medium text-text">{a.name}</Text>
                        <Text className="text-[11.5px] text-text-secondary mt-0.5">{a.breed}</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Section Recherches récentes (Screen 21) */}
          <View className="mt-2 mb-6">
            <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-3 pl-0.5">
              Recherches récentes
            </Text>
            <View className="gap-2.5">
              {recentSearches.map((term) => (
                <Pressable
                  key={term}
                  onPress={() => setQuery(term)}
                  className="flex-row items-center gap-2 py-1 active:opacity-75">
                  <Icon name="search" size={14} color={colors.textTertiary} decorative />
                  <Text className="text-[13.5px] text-text-secondary">{term}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}
