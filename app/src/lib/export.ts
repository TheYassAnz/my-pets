import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { api, ApiError } from './api';
import { ACCESS_TOKEN_KEY, getToken } from './token-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Télécharge le carnet PDF généré par l'API puis ouvre la feuille de partage
export async function exportAndShareHealthRecord(
  animalId: string,
  animalName: string,
): Promise<void> {
  if (!API_URL) {
    throw new ApiError(0, 'EXPO_PUBLIC_API_URL non configurée');
  }

  // Passe par le client API d'abord : rafraîchit l'access token si expiré
  await api.getAnimal(animalId);
  const accessToken = await getToken(ACCESS_TOKEN_KEY);

  const filename = `carnet-${animalName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
  const destination = new File(Paths.cache, filename);
  if (destination.exists) {
    destination.delete();
  }

  const task = File.createDownloadTask(
    `${API_URL}/animals/${animalId}/export`,
    destination,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const file = await task.downloadAsync();
  if (!file) {
    throw new ApiError(0, 'Téléchargement du PDF interrompu');
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new ApiError(0, 'Partage indisponible sur cet appareil');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Carnet de santé — ${animalName}`,
    UTI: 'com.adobe.pdf',
  });
}
