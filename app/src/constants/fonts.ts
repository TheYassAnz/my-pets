import {
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

// Une famille par graisse : sur React Native, `fontWeight` ne sélectionne pas
// la graisse d'une police chargée via expo-font, il faut nommer la famille.
export const AppFontSources = {
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
};

const FAMILY = {
  normal: 'Nunito_500Medium',
  medium: 'Nunito_600SemiBold',
  semibold: 'Nunito_700Bold',
  bold: 'Nunito_800ExtraBold',
} as const;

const WEIGHT_CLASS = /\bfont-(normal|medium|semibold|bold)\b/;

/**
 * Sépare la classe de graisse (`font-bold`…) du reste du `className` et renvoie
 * la famille de police correspondante. Sans classe de graisse : texte courant.
 */
export function resolveFont(className?: string): { fontFamily: string; className?: string } {
  const match = className ? WEIGHT_CLASS.exec(className) : null;
  return {
    fontFamily: FAMILY[(match?.[1] as keyof typeof FAMILY) ?? 'medium'],
    className: className?.replace(WEIGHT_CLASS, '').trim() || undefined,
  };
}
