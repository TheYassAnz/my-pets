import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, useColorScheme, View } from 'react-native';

import { Card, Icon, Screen, Skeleton } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { api, type DocumentItem } from '@/lib/api';

type CategoryFilter = 'Tous' | 'Carnets' | 'Assurance' | 'Ordonnances';

export default function DocumentsScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [filter, setFilter] = useState<CategoryFilter>('Tous');
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    return api
      .listDocuments(undefined, filter)
      .then(setDocs)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  if (loading && docs.length === 0) {
    return (
      <View className="flex-1 bg-surface p-5 pt-14 gap-4">
        <Skeleton variant="card" count={3} />
      </View>
    );
  }

  // Documents de démo si la BDD est encore vide
  const sampleDocs = [
    {
      id: 'd1',
      title: 'Carnet de santé — Pilou',
      subtitle: 'PDF · 2,4 Mo · mis à jour le 3 mars',
    },
    {
      id: 'd2',
      title: 'Attestation d\'assurance',
      subtitle: 'Mutuelle Animo · valide jusqu\'au 31 déc',
    },
    {
      id: 'd3',
      title: 'Ordonnance — Nala',
      subtitle: 'PDF · 12 nov 2025',
    },
    {
      id: 'd4',
      title: 'Certificat d\'identification',
      subtitle: 'Photo · puce 250269…',
    },
  ];

  const displayDocs =
    docs.length > 0
      ? docs.map((d) => ({
          id: d.id,
          title: d.title,
          subtitle: `${d.fileSize ?? 'PDF · 1,2 Mo'} · mis à jour récemment`,
        }))
      : sampleDocs;

  return (
    <View className="flex-1 bg-surface">
      <Stack.Screen options={{ headerShown: false }} />

      <Screen scroll contentContainerClassName="pb-36">
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerClassName="pt-3 px-5">
          {/* En-tête Screen 9 */}
          <View className="pt-2 mb-4">
            <Text className="text-[26px] font-medium text-text tracking-tight">Documents</Text>
            <Text className="text-[13px] text-text-secondary mt-0.5">
              Carnets, assurances, ordonnances
            </Text>
          </View>

          {/* Filtres par catégorie */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pb-5">
            {(['Tous', 'Carnets', 'Assurance', 'Ordonnances'] as const).map((cat) => {
              const isSelected = filter === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setFilter(cat)}
                  className={`rounded-sm px-3 py-1 border ${
                    isSelected
                      ? 'border-brand/70 bg-brand/15'
                      : 'border-border/60 bg-surface'
                  }`}>
                  <Text
                    className={`text-[12px] font-medium ${
                      isSelected ? 'text-primary font-semibold' : 'text-text-secondary'
                    }`}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Liste des documents */}
          <View className="gap-2.5 mb-5">
            {displayDocs.map((doc) => (
              <Pressable
                key={doc.id}
                onPress={() =>
                  router.push({
                    pathname: '/document-viewer',
                    params: { title: doc.title },
                  })
                }
                className="active:opacity-80">
                <View className="flex-row items-center gap-3.5 p-3.5 rounded-md bg-surface border border-border/50 shadow-sm">
                  <Icon name="document" size={18} color={colors.primary} decorative />
                  <View className="flex-1">
                    <Text className="text-[14px] font-medium text-text">{doc.title}</Text>
                    <Text className="text-[11.5px] text-text-secondary mt-0.5">
                      {doc.subtitle}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Jauge de stockage (Screen 9) */}
          <View className="p-4 rounded-lg bg-surface border border-border/50 shadow-sm gap-2.5 mb-5">
            <View className="flex-row justify-between items-baseline">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                Stockage
              </Text>
              <Text className="text-[12px] text-text-secondary">48 Mo / 1 Go</Text>
            </View>

            <View className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
              <View style={{ width: '5%' }} className="h-full bg-primary rounded-full" />
            </View>
          </View>

          {/* Bouton Scanner un document dashed */}
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/document-viewer',
                params: { title: 'Nouveau scan' },
              })
            }
            className="w-full h-12 rounded-lg border border-dashed border-border items-center justify-center active:bg-surface-elevated">
            <Text className="text-[13.5px] font-medium text-text-secondary">
              Scanner un document
            </Text>
          </Pressable>
        </ScrollView>
      </Screen>
    </View>
  );
}
