// Les dates de l'API circulent en ISO court (AAAA-MM-JJ). `new Date('2026-03-12')`
// serait interprété en UTC : dans un fuseau négatif, l'affichage local reculerait
// d'un jour. On construit et on relit donc toujours la date en heure locale.

export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Format long attendu par PET-5 côté saisie : « 12 mars 2026 ».
export function formatLongDate(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function isFutureDate(iso: string, today: Date = new Date()): boolean {
  const date = parseIsoDate(iso);
  if (!date) return false;
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date.getTime() > endOfToday.getTime();
}
