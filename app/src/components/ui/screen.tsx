import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: ReactNode;
  /** Défilant par défaut — passer `false` pour un contenu centré (ex. état vide). */
  scroll?: boolean;
  /** Fusionnée en dernier dans la classe du conteneur : permet à l'appelant de surcharger le style. */
  className?: string;
  contentContainerClassName?: string;
};

// NativeTabs n'ajuste automatiquement que le bas (hauteur du tab bar), et
// seulement pour le premier ScrollView de l'écran — jamais le haut (barre de
// statut/encoche), sur aucune plateforme, et jamais pour un `View` brut (les
// états chargement/erreur de chaque écran). D'où ce rembourrage explicite,
// posé une fois ici plutôt que rappelé (ou oublié) écran par écran.
export function Screen({ children, scroll = true, className, contentContainerClassName }: ScreenProps) {
  const insets = useSafeAreaInsets();

  if (!scroll) {
    return (
      <View
        style={{ paddingTop: insets.top }}
        className={`flex-1 bg-surface ${className ?? ''}`}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ paddingTop: insets.top }}
      className={`flex-1 bg-surface ${className ?? ''}`}
      contentContainerClassName={contentContainerClassName}>
      {children}
    </ScrollView>
  );
}
