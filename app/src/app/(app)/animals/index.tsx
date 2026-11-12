import { Redirect } from 'expo-router';

// L'écran « Mes animaux » est l'onglet (tabs)/index ; /animals reste une URL valide.
export default function AnimalsIndex() {
  return <Redirect href="/" />;
}
