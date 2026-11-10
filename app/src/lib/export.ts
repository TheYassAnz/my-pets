import { api } from './api';

// Télécharge le carnet PDF généré par l'API via un lien <a download> temporaire
export async function exportAndShareHealthRecord(
  animalId: string,
  animalName: string,
): Promise<void> {
  const blob = await api.downloadHealthRecord(animalId);
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = `carnet-${animalName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      link.remove();
    }
  } finally {
    // Safari/Firefox démarrent le téléchargement après click() : révocation différée.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
