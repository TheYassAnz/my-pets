import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyHousehold } from '@/components/empty-household';
import {
  Button,
  Card,
  Checkbox,
  HighlightCard,
  Icon,
  OfflineBanner,
  Screen,
  Skeleton,
} from '@/components/ui';
import { Colors } from '@/constants/theme';
import {
  api,
  type AnimalWithUpcoming,
  type TodayTask,
  type UpcomingHealthEvent,
} from '@/lib/api';
import { useSession } from '@/lib/auth-context';
import { formatDate } from '@/lib/health-events';
import { useAppStore } from '@/lib/store/use-app-store';

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user } = useSession();

  const { selectedAnimalId, setSelectedAnimalId } = useAppStore();

  const [animals, setAnimals] = useState<AnimalWithUpcoming[]>([]);
  const [tasks, setTasks] = useState<TodayTask[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingHealthEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    return Promise.all([
      api.listAnimals().catch(() => []),
      api.listTodayTasks().catch(() => []),
      api.listUpcomingEvents(90).catch(() => []),
    ]).then(([animalsRes, tasksRes, upcomingRes]) => {
      setAnimals(animalsRes);
      setTasks(tasksRes);
      setUpcoming(upcomingRes);
      setLoading(false);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, [loadData]);

  const toggleTask = async (task: TodayTask) => {
    // Mise à jour optimiste
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, checked: !t.checked } : t)),
    );
    try {
      await api.toggleTask(task.routineId);
    } catch {
      // Revert en cas d'erreur
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, checked: task.checked } : t)),
      );
    }
  };

  // Filtrage des tâches selon l'animal sélectionné
  const selectedAnimal = animals.find((a) => a.id === selectedAnimalId);
  const filteredTasks = selectedAnimal
    ? tasks.filter((t) => t.animal === selectedAnimal.name)
    : tasks;

  const nextAppointment = upcoming[0];

  // Date du jour formatée : ex. "Jeudi 10 septembre"
  const rawDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const todayFormatted = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  // Nom d'utilisateur pour la salutation
  const userName = user?.email ? user.email.split('@')[0] : 'Camille';
  const greetingName = userName.charAt(0).toUpperCase() + userName.slice(1);

  if (loading && animals.length === 0) {
    return (
      <View className="flex-1 bg-surface p-4 pt-14 gap-4">
        <Skeleton variant="card" />
        <Skeleton variant="row" count={4} />
      </View>
    );
  }

  if (!loading && animals.length === 0) {
    return (
      <View className="flex-1 bg-surface pt-12">
        <EmptyHousehold onAddAnimal={() => router.push('/animals/new')} />
      </View>
    );
  }

  const completedCount = filteredTasks.filter((t) => t.checked).length;
  const totalCount = filteredTasks.length;
  const progressRatio = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <View className="flex-1 bg-surface">
      <Screen scroll contentContainerClassName="pb-36">
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerClassName="pt-2">
          {/* Bandeau hors ligne automatique (Screen 23) */}
          <OfflineBanner />

          {/* Header Screen 1 */}
          <View className="px-5 pt-3 pb-2 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
                {todayFormatted}
              </Text>
              <Text className="text-[26px] font-medium text-text tracking-tight mt-0.5">
                Bonjour {greetingName}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              {/* Bouton Recherche globale (Screen 21) */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Recherche globale"
                onPress={() => router.push('/search')}
                className="w-10 h-10 rounded-full border border-border items-center justify-center active:bg-surface-elevated">
                <Icon name="search" size={17} color={colors.textSecondary} decorative />
              </Pressable>

              {/* Bouton cloche notifications (Screen 20) */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Centre de notifications"
                onPress={() => router.push('/notifications')}
                className="w-10 h-10 rounded-full border border-border items-center justify-center relative active:bg-surface-elevated">
                <Icon name="bell" size={18} color={colors.textSecondary} decorative />
                <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary" />
              </Pressable>
            </View>
          </View>

          {/* Carrousel sélecteur d'animaux */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-5 gap-2.5 py-3">
            <Pressable
              onPress={() => setSelectedAnimalId(null)}
              className={`flex-row items-center gap-2 rounded-full px-3.5 py-1.5 border ${
                selectedAnimalId === null
                  ? 'bg-surface-elevated border-brand/50 shadow-sm'
                  : 'bg-surface border-border/60'
              }`}>
              <View
                className={`w-6 h-6 rounded-full items-center justify-center ${
                  selectedAnimalId === null ? 'bg-brand/20' : 'bg-surface-sunken'
                }`}>
                <Text
                  className={`text-[10px] font-bold ${
                    selectedAnimalId === null ? 'text-brand' : 'text-text-secondary'
                  }`}>
                  *
                </Text>
              </View>
              <Text
                className={`text-[13px] ${
                  selectedAnimalId === null ? 'text-text font-medium' : 'text-text-secondary'
                }`}>
                Tous
              </Text>
            </Pressable>

            {animals.map((a) => {
              const isSelected = selectedAnimalId === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => setSelectedAnimalId(isSelected ? null : a.id)}
                  className={`flex-row items-center gap-2 rounded-full px-3.5 py-1.5 border ${
                    isSelected
                      ? 'bg-surface-elevated border-brand/50 shadow-sm'
                      : 'bg-surface border-border/60'
                  }`}>
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center ${
                      isSelected ? 'bg-brand/20' : 'bg-surface-sunken'
                    }`}>
                    <Text
                      className={`text-[11px] font-bold ${
                        isSelected ? 'text-brand' : 'text-text-secondary'
                      }`}>
                      {a.name[0]?.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    className={`text-[13px] ${
                      isSelected ? 'text-text font-medium' : 'text-text-secondary'
                    }`}>
                    {a.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Section "À faire aujourd'hui" */}
          <View className="px-5 mt-3">
            <View className="flex-row items-baseline justify-between mb-2">
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                À faire aujourd&apos;hui
              </Text>
              <Text className="text-xs font-semibold text-primary">
                {completedCount} / {totalCount}
              </Text>
            </View>

            {/* Barre de progression fine */}
            <View className="h-[2px] rounded-full bg-surface-sunken overflow-hidden mb-3.5">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${progressRatio}%` }}
              />
            </View>

            {filteredTasks.length === 0 ? (
              <Card elevated className="p-4 items-center justify-center">
                <Text className="text-caption text-text-secondary">
                  Toutes les tâches du jour sont terminées !
                </Text>
              </Card>
            ) : (
              <View className="gap-2.5">
                {filteredTasks.map((task) => (
                  <View
                    key={task.id}
                    className="flex-row items-center gap-3 p-3.5 rounded-lg bg-surface border border-border/50">
                    <Checkbox
                      variant="round"
                      checked={task.checked}
                      onCheckedChange={() => toggleTask(task)}
                    />
                    <View className="flex-1">
                      <Text
                        className={`text-[14px] font-medium ${
                          task.checked ? 'text-text-tertiary line-through' : 'text-text'
                        }`}>
                        {task.title}
                      </Text>
                      {task.subtitle ? (
                        <Text
                          className={`text-[11px] mt-0.5 ${
                            task.checked ? 'text-text-tertiary' : 'text-text-secondary'
                          }`}>
                          {task.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <View className="rounded-sm bg-surface-sunken px-2 py-0.5 border border-border/60">
                      <Text className="text-[11px] font-medium text-text-secondary">
                        {task.animal}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Section Prochain Rendez-vous */}
          {nextAppointment ? (
            <View className="px-5 mt-5">
              <HighlightCard
                kicker="Prochain rendez-vous"
                title={`${nextAppointment.title} — ${nextAppointment.animalName}`}
                subtitle={`${formatDate(nextAppointment.nextDueDate)}${
                  nextAppointment.description ? ` · ${nextAppointment.description}` : ''
                }`}
                actions={
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={() => router.push('/calendar')}>
                      Ajouter au calendrier
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onPress={() => router.push('/calendar')}>
                      Déplacer
                    </Button>
                  </>
                }
              />
            </View>
          ) : null}
        </ScrollView>
      </Screen>

      {/* Bouton d'action flottant (FAB) */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ajouter"
        onPress={() => router.push('/animals/new')}
        className="absolute right-5 rounded-full border border-brand/70 bg-brand/15 items-center justify-center shadow-md active:opacity-75"
        style={{
          width: 52,
          height: 52,
          bottom: Math.max(insets.bottom + 64, 104),
        }}>
        <Icon name="add" size={24} color={colors.brand} decorative />
      </Pressable>
    </View>
  );
}
