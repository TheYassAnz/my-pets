import * as ImagePicker from 'expo-image-picker';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  ListRow,
  Skeleton,
  useToast,
} from '@/components/ui';
import { api, ApiError, type Animal, type HealthEvent } from '@/lib/api';
import { exportAndShareHealthRecord } from '@/lib/export';
import { AI_EXTRACTION_ENABLED } from '@/lib/features';
import { EVENT_ICONS, EVENT_LABELS, formatDate } from '@/lib/health-events';

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { show } = useToast();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    // Purger l'erreur avant chaque tentative : sans cela, `error` reste positionné
    // après un « Réessayer » réussi et l'écran d'erreur ne disparaît jamais.
    setError(null);
    api
      .getAnimal(id)
      .then((a) => {
        setAnimal(a);
        setName(a.name);
        setSpecies(a.species);
      })
      .catch((e: unknown) => {
        setError(e instanceof ApiError ? e.message : 'Chargement impossible');
      });
    api
      .listEvents(id)
      .then(setEvents)
      .catch(() => {
        // Timeline non bloquante : l'échec ne casse pas la fiche animal
      });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onSave = async () => {
    if (!name.trim() || !species.trim()) {
      setError('Nom et espèce requis');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const updated = await api.updateAnimal(id, {
        name: name.trim(),
        species: species.trim(),
      });
      setAnimal(updated);
      show('Animal mis à jour');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Mise à jour impossible');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Supprimer cet animal ?', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteAnimal(id);
            router.back();
          } catch (e) {
            setError(e instanceof ApiError ? e.message : 'Suppression impossible');
          }
        },
      },
    ]);
  };

  const onPickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Autorisation d'accès aux photos requise");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const updated = await api.uploadAnimalPhoto(id, {
        uri: asset.uri,
        name: asset.fileName ?? 'photo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      });
      setAnimal(updated);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Envoi de la photo impossible');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onExport = async () => {
    setError(null);
    setExporting(true);
    try {
      await exportAndShareHealthRecord(id, animal?.name ?? 'animal');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export du carnet impossible');
    } finally {
      setExporting(false);
    }
  };

  if (error && !animal) {
    return (
      <View className="flex-1 justify-center bg-surface">
        <ErrorState message={error} onRetry={load} />
      </View>
    );
  }

  if (!animal) {
    return (
      <View className="flex-1 bg-surface p-4">
        <Skeleton variant="card" count={2} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="p-4 gap-4">
      {error ? <Text className="text-callout text-danger">{error}</Text> : null}

      <Card>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Changer la photo"
          disabled={uploadingPhoto}
          onPress={onPickPhoto}
          className="items-center gap-2">
          <Avatar uri={animal.photoUrl} size="lg" />
          <Text className="text-callout text-primary">
            {uploadingPhoto ? 'Envoi…' : 'Changer la photo'}
          </Text>
        </Pressable>

        <Input label="Nom" value={name} onChangeText={setName} />
        <Input label="Espèce" value={species} onChangeText={setSpecies} />

        <Button label="Enregistrer" loading={saving} onPress={onSave} />
      </Card>

      <Card>
        <Button
          variant="secondary"
          icon="document"
          label="Exporter le carnet (PDF)"
          loading={exporting}
          onPress={onExport}
        />
        <Button variant="destructive" icon="trash" label="Supprimer" onPress={onDelete} />
      </Card>

      <Card>
        <View className="flex-row items-center justify-between">
          <Text className="text-headline font-semibold text-text">Carnet de santé</Text>
          <View className="flex-row gap-2">
            {AI_EXTRACTION_ENABLED && (
              <Link href={`/animals/${id}/events/scan`} asChild>
                <Button variant="secondary" icon="camera" label="Scanner" />
              </Link>
            )}
            <Link href={`/animals/${id}/events/new`} asChild>
              <Button icon="add" label="Événement" />
            </Link>
          </View>
        </View>

        {events.length === 0 ? (
          <EmptyState
            icon="document"
            title="Aucun événement"
            message="Ajoutez un vaccin, un traitement ou une visite."
            actionLabel="Ajouter un événement"
            onAction={() => router.push(`/animals/${id}/events/new`)}
          />
        ) : (
          events.map((event) => (
            <ListRow
              key={event.id}
              leading={<Badge label={EVENT_LABELS[event.type]} icon={EVENT_ICONS[event.type]} />}
              title={event.title}
              subtitle={formatDate(event.date)}
              trailing={
                event.nextDueDate ? (
                  <Badge label={`Rappel ${formatDate(event.nextDueDate)}`} tone="warning" />
                ) : undefined
              }
              onPress={() => router.push(`/animals/${id}/events/${event.id}`)}
            />
          ))
        )}
      </Card>
    </ScrollView>
  );
}
