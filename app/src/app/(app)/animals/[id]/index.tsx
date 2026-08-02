import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import {
  Avatar,
  Badge,
  Button,
  Card,
  DateField,
  EmptyState,
  ErrorState,
  FormField,
  ListRow,
  Skeleton,
  SpeciesPicker,
  useToast,
} from '@/components/ui';
import { computeAge, OTHER_SPECIES, resolveSpecies, splitSpecies } from '@/lib/animals';
import { api, ApiError, type Animal, type HealthEvent } from '@/lib/api';
import { exportAndShareHealthRecord } from '@/lib/export';
import { AI_EXTRACTION_ENABLED } from '@/lib/features';
import { animalSchema, type AnimalValues } from '@/lib/forms/schemas';
import { EVENT_ICONS, EVENT_LABELS, formatDate } from '@/lib/health-events';

export default function AnimalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { show } = useToast();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [exporting, setExporting] = useState(false);
  const speciesOtherRef = useRef<TextInput>(null);

  const { control, handleSubmit, reset, formState } = useForm<AnimalValues>({
    resolver: zodResolver(animalSchema),
    mode: 'onTouched',
    defaultValues: { name: '', speciesChoice: 'Chien', speciesOther: '', birthDate: null },
  });

  // `useWatch` plutôt que `watch()` : cette dernière renvoie une fonction que le
  // React Compiler ne peut pas mémoïser, ce qui lui fait sauter tout l'écran.
  const speciesChoice = useWatch({ control, name: 'speciesChoice' });

  const load = useCallback(() => {
    // Purger l'erreur avant chaque tentative : sans cela, `error` reste positionné
    // après un « Réessayer » réussi et l'écran d'erreur ne disparaît jamais.
    setError(null);
    api
      .getAnimal(id)
      .then((a) => {
        setAnimal(a);
        const species = splitSpecies(a.species);
        reset({
          name: a.name,
          speciesChoice: species.choice,
          speciesOther: species.other,
          birthDate: a.birthDate ? a.birthDate.slice(0, 10) : null,
        });
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
  }, [id, reset]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onSave = handleSubmit(async (values) => {
    setError(null);
    try {
      const updated = await api.updateAnimal(id, {
        name: values.name.trim(),
        species: resolveSpecies({ choice: values.speciesChoice, other: values.speciesOther }),
        birthDate: values.birthDate ?? undefined,
      });
      setAnimal(updated);
      show('Animal mis à jour');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Mise à jour impossible');
    }
  });

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

        {/* Un animal sans date de naissance n'affiche simplement pas d'âge (PET-8). */}
        {animal.birthDate && computeAge(animal.birthDate.slice(0, 10)) ? (
          <Text className="text-callout text-text-secondary text-center">
            {computeAge(animal.birthDate.slice(0, 10))}
          </Text>
        ) : null}

        <FormField
          control={control}
          name="name"
          label="Nom"
          returnKeyType="next"
          submitBehavior={speciesChoice === OTHER_SPECIES ? 'submit' : 'blurAndSubmit'}
          onSubmitEditing={() => speciesOtherRef.current?.focus()}
        />

        <Controller
          control={control}
          name="speciesChoice"
          render={({ field, fieldState }) => (
            <SpeciesPicker
              label="Espèce"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />

        {speciesChoice === OTHER_SPECIES ? (
          <FormField
            control={control}
            name="speciesOther"
            label="Préciser l'espèce"
            placeholder="Ex : Furet, Cheval…"
            inputRef={speciesOtherRef}
            returnKeyType="done"
            onSubmitEditing={onSave}
          />
        ) : null}

        <Controller
          control={control}
          name="birthDate"
          render={({ field, fieldState }) => (
            <DateField
              label="Date de naissance"
              placeholder="Optionnelle"
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
              clearable
              maximumDate={new Date()}
            />
          )}
        />

        <Button label="Enregistrer" loading={formState.isSubmitting} onPress={onSave} />
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
