import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { api, ApiError } from '@/lib/api';

const LEAD_DAY_OPTIONS = [30, 15, 7, 3, 1, 0];

function leadDayLabel(day: number): string {
  return day === 0 ? 'Jour J' : `J-${day}`;
}

export default function SettingsScreen() {
  const [leadDays, setLeadDays] = useState<number[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api
        .getReminderSettings()
        .then((s) => setLeadDays(s.leadDays))
        .catch((e: unknown) => {
          setError(e instanceof ApiError ? e.message : 'Chargement impossible');
        });
    }, []),
  );

  const toggle = (day: number) => {
    if (!leadDays) return;
    setSaved(false);
    setLeadDays(
      leadDays.includes(day)
        ? leadDays.filter((d) => d !== day)
        : [...leadDays, day],
    );
  };

  const onSave = async () => {
    if (!leadDays || leadDays.length === 0) {
      setError('Sélectionnez au moins un délai de rappel');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const updated = await api.updateReminderSettings(leadDays);
      setLeadDays(updated.leadDays);
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  if (!leadDays) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        {error ? (
          <Text className="text-red-600 dark:text-red-400 text-sm px-8">{error}</Text>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="px-8 pt-8 pb-16 gap-4">
      <Text className="text-2xl font-bold text-black dark:text-white">Réglages</Text>

      <Text className="text-lg font-semibold text-black dark:text-white mt-2">
        Rappels de santé
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-sm">
        Recevez une notification avant chaque échéance (vaccin, traitement,
        visite). Choisissez quand être prévenu :
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {LEAD_DAY_OPTIONS.map((day) => {
          const active = leadDays.includes(day);
          return (
            <Pressable
              key={day}
              className={`rounded-full border px-4 py-2 ${
                active
                  ? 'bg-blue-600 border-blue-600'
                  : 'border-gray-300 dark:border-gray-700'
              }`}
              onPress={() => toggle(day)}>
              <Text
                className={
                  active ? 'text-white font-semibold' : 'text-black dark:text-white'
                }>
                {leadDayLabel(day)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error && <Text className="text-red-600 dark:text-red-400 text-sm">{error}</Text>}
      {saved && (
        <Text className="text-green-600 dark:text-green-400 text-sm">
          Réglages enregistrés ✓
        </Text>
      )}

      <Pressable
        className="rounded-xl bg-blue-600 py-3 items-center active:opacity-80 disabled:opacity-50"
        disabled={saving}
        onPress={onSave}>
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Enregistrer</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}
