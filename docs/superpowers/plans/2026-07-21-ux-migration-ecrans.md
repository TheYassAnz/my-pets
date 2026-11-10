# Migration des écrans (Lot 2b + Lot 3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compléter la librairie avec les trois composants qui manquaient (Lot 2b), puis migrer les 14 écrans de l'app dessus, en supprimant toute couleur codée en dur, toute variante `dark:` manuelle et tous les emoji d'interface.

**Architecture:** Aucun changement d'architecture. La librairie `src/components/ui/` existe et est testée ; ce plan la consomme. Chaque écran est migré isolément : mêmes routes, mêmes appels API, même comportement — seule la couche de présentation change. Un écran migré est un livrable vérifiable seul, ce qui permet d'arrêter à tout moment sans laisser l'app dans un état incohérent.

**Tech Stack:** Expo SDK 56 · React Native 0.85.3 · React 19.2.3 · NativeWind 4.2.6 · TypeScript 6 (strict) · jest-expo + @testing-library/react-native.

## Global Constraints

- Toutes les commandes s'exécutent depuis `app/` (dépôt git autonome ; la racine `my-pets/` n'en est pas un).
- Branche : **on reste sur `feat/ux-fondations`**, à la suite des 21 commits existants.
- **Expo a changé** : lire `https://docs.expo.dev/versions/v56.0.0/` avant tout code Expo (cf. `app/AGENTS.md`).
- Toute dépendance s'installe avec `npx expo install` (jamais `npm install`). Ce plan n'en requiert aucune.
- TypeScript `strict: true`. Alias `@/*` → `./src/*`.
- **Import unique** : les écrans importent depuis le barrel — `import { Button, Input, Card } from '@/components/ui'`.
- **Zéro couleur codée en dur, zéro variante `dark:`** dans les écrans migrés. Les tokens gèrent déjà les deux thèmes.
- **Zéro emoji** dans l'UI fonctionnelle : tout passe par `<Icon>`. (Le mot « my-pets 🐾 » du titre de marque est la seule exception tolérée, et seulement s'il est traité comme du texte de marque.)
- Tout élément interactif : ≥44pt et nom accessible — garantis par les composants, à ne pas défaire.
- Langue de l'UI : **français**.
- **API de test — RNTL 14** : `render()` et `fireEvent.*()` retournent des Promises. Tout test qui rend est `async`, avec `await` sur les deux. Oublier le `await` sur `render` ne lève aucune erreur : `screen` reste vide et les requêtes échouent de façon déroutante. `act` prend un callback `async`. Les requêtes excluent par défaut les nœuds masqués (`{ includeHiddenElements: true }` si besoin).
- Globals jest fournis par `jest-env.d.ts` — **ne pas** ajouter `/// <reference types="jest" />`.
- Commits : Conventional Commits, message en **français**. Un commit par tâche, après vérification verte.
- **Interdit de modifier la logique métier** : appels API, navigation, validation, gestion d'erreur gardent leur comportement. Ce plan ne touche que la présentation. Toute divergence de comportement constatée est un bug à signaler, pas à corriger en passant.

---

## File Structure

**Partie A — créés (Lot 2b) :**

| Fichier | Responsabilité |
|---|---|
| `src/components/ui/avatar.tsx` | Photo d'animal ronde avec repli icône patte |
| `src/components/ui/badge.tsx` | Pastille de type d'événement (vaccin / traitement / visite) |
| `src/components/ui/__tests__/avatar.test.tsx` | Tests Avatar |
| `src/components/ui/__tests__/badge.test.tsx` | Tests Badge |

**Partie A — modifiés :**

| Fichier | Changement |
|---|---|
| `src/components/ui/card.tsx` | `onPress?` optionnel → carte pressable, même contrat que `ListRow` |
| `src/components/ui/index.ts` | Exporter `Avatar`, `Badge` et leurs types |
| `src/components/ui/__tests__/card.test.tsx` | Tests du mode pressable |

**Partie B — modifiés (Lot 3), un écran par tâche :**

`src/app/_layout.tsx` · `src/components/app-tabs.tsx` · `src/app/(app)/explore.tsx` → `settings.tsx` · `sign-in.tsx` · `sign-up.tsx` · `forgot-password.tsx` · `reset-password.tsx` · `(app)/animals/index.tsx` · `(app)/animals/new.tsx` · `(app)/animals/[id]/index.tsx` · `(app)/animals/[id]/events/new.tsx` · `(app)/animals/[id]/events/[eventId].tsx` · `(app)/animals/[id]/events/scan.tsx` · `(app)/index.tsx` · `src/components/health-event-form.tsx` · `src/lib/health-events.ts`

---

# Partie A — Lot 2b : les trois composants manquants

## Task 1: Composant `Avatar`

La liste des animaux et la fiche animal affichent toutes deux une photo ronde avec un repli quand `photoUrl` est absent. Sans composant, ce motif serait réécrit à chaque écran.

**Files:**
- Create: `app/src/components/ui/avatar.tsx`
- Create: `app/src/components/ui/__tests__/avatar.test.tsx`

**Interfaces:**
- Consomme : tokens, `Icon`, `expo-image` (déjà utilisé par les écrans actuels).
- Produit : `<Avatar uri? size? label? testID? />` avec `type AvatarSize = 'sm' | 'lg'` (`sm` = 48px pour les listes, `lg` = 112px pour la fiche). Consommé par les Tasks 8 et 11.

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

Créer `app/src/components/ui/__tests__/avatar.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react-native';

import { Avatar } from '@/components/ui/avatar';

describe('Avatar', () => {
  it('affiche la photo quand une URI est fournie', async () => {
    await render(<Avatar uri="https://example.test/rex.jpg" label="Photo de Rex" />);

    expect(screen.getByLabelText('Photo de Rex')).toBeTruthy();
  });

  it('affiche le repli quand aucune URI n’est fournie', async () => {
    await render(<Avatar label="Photo de Rex" testID="avatar" />);

    // Le repli est une icône décorative dans un conteneur : pas d'image rendue.
    expect(screen.queryByLabelText('Photo de Rex')).toBeNull();
    expect(screen.getByTestId('avatar')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

```bash
cd app && npx jest avatar
```

Attendu : ÉCHEC — `Cannot find module '@/components/ui/avatar'`.

- [ ] **Step 3: Implémenter**

Créer `app/src/components/ui/avatar.tsx` :

```tsx
import { Image } from 'expo-image';
import { View } from 'react-native';

import { Icon } from './icon';

export type AvatarSize = 'sm' | 'lg';

const BOX: Record<AvatarSize, string> = {
  sm: 'w-12 h-12',
  lg: 'w-28 h-28',
};

const GLYPH: Record<AvatarSize, number> = {
  sm: 20,
  lg: 44,
};

export type AvatarProps = {
  /** Photo de l'animal. Absente → repli icône. */
  uri?: string | null;
  size?: AvatarSize;
  /** Nom accessible de la photo. Omis → l'avatar est décoratif. */
  label?: string;
  testID?: string;
};

export function Avatar({ uri, size = 'sm', label, testID }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={label}
        testID={testID}
        contentFit="cover"
        className={`${BOX[size]} rounded-full`}
      />
    );
  }

  return (
    <View
      testID={testID}
      className={`${BOX[size]} items-center justify-center rounded-full bg-surface-sunken`}>
      <Icon name="paw" size={GLYPH[size]} decorative />
    </View>
  );
}
```

- [ ] **Step 4: Lancer les tests**

```bash
cd app && npx jest avatar
```

Attendu : 2 tests passent.

- [ ] **Step 5: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 6: Commit**

```bash
cd app
git add src/components/ui/avatar.tsx src/components/ui/__tests__/avatar.test.tsx
git commit -m "feat: ajouter le composant Avatar"
```

---

## Task 2: Composant `Badge`

La timeline affiche le type de chaque événement. Aujourd'hui c'est un emoji (`💉` `💊` `🩺`) suivi d'un libellé — deux problèmes d'un coup (emoji lu littéralement par les lecteurs d'écran, aucune hiérarchie visuelle).

**Files:**
- Create: `app/src/components/ui/badge.tsx`
- Create: `app/src/components/ui/__tests__/badge.test.tsx`

**Interfaces:**
- Consomme : tokens, typo, `Icon`.
- Produit : `<Badge label icon? tone? testID? />` avec `type BadgeTone = 'neutral' | 'primary' | 'warning'`. Consommé par les Tasks 11 et 12.

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

Créer `app/src/components/ui/__tests__/badge.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react-native';

import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('affiche son libellé', async () => {
    await render(<Badge label="Vaccin" />);

    expect(screen.getByText('Vaccin')).toBeTruthy();
  });

  it('n’est pas annoncé comme un bouton', async () => {
    // Un badge est purement informatif : le présenter comme actionnable
    // tromperait les utilisateurs de lecteurs d'écran.
    await render(<Badge label="Vaccin" icon="vaccine" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

```bash
cd app && npx jest badge
```

Attendu : ÉCHEC — module introuvable.

- [ ] **Step 3: Implémenter**

Créer `app/src/components/ui/badge.tsx` :

```tsx
import { useColorScheme, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { Icon, type IconName } from './icon';

export type BadgeTone = 'neutral' | 'primary' | 'warning';

const CONTAINER: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken',
  primary: 'bg-primary-surface',
  warning: 'bg-surface-sunken',
};

const LABEL: Record<BadgeTone, string> = {
  neutral: 'text-text-secondary',
  primary: 'text-primary',
  warning: 'text-warning',
};

export type BadgeProps = {
  label: string;
  icon?: IconName;
  tone?: BadgeTone;
  testID?: string;
};

export function Badge({ label, icon, tone = 'neutral', testID }: BadgeProps) {
  // `Icon` attend une couleur résolue : une classe ne l'atteindrait pas.
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const glyphColor = tone === 'primary' ? colors.primary : colors.textSecondary;

  return (
    <View
      testID={testID}
      className={`flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${CONTAINER[tone]}`}>
      {icon ? <Icon name={icon} size={14} color={glyphColor} decorative /> : null}
      <Text className={`text-caption font-medium ${LABEL[tone]}`}>{label}</Text>
    </View>
  );
}
```

- [ ] **Step 4: Lancer les tests**

```bash
cd app && npx jest badge
```

Attendu : 2 tests passent.

- [ ] **Step 5: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 6: Commit**

```bash
cd app
git add src/components/ui/badge.tsx src/components/ui/__tests__/badge.test.tsx
git commit -m "feat: ajouter le composant Badge"
```

---

## Task 3: `Card` pressable + export des nouveaux composants

Sans `onPress`, une carte cliquable devrait être enveloppée dans un `Pressable` nu par chaque écran — perdant le feedback `active:` et le rôle accessible que `ListRow` fournit déjà.

**Files:**
- Modify: `app/src/components/ui/card.tsx`
- Modify: `app/src/components/ui/__tests__/card.test.tsx`
- Modify: `app/src/components/ui/index.ts`
- Modify: `app/src/components/ui/__tests__/index.test.tsx`

**Interfaces:**
- Produit : `Card` accepte `onPress?` et `accessibilityLabel?`. Le barrel exporte `Avatar`, `AvatarProps`, `AvatarSize`, `Badge`, `BadgeProps`, `BadgeTone`.

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

Ajouter au `describe('Card')` de `app/src/components/ui/__tests__/card.test.tsx` :

```tsx
  it('est un bouton accessible quand elle est pressable', async () => {
    const onPress = jest.fn();
    await render(
      <Card onPress={onPress} accessibilityLabel="Fiche de Rex">
        <Text>Rex</Text>
      </Card>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Fiche de Rex' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('n’est pas un bouton quand elle n’est pas pressable', async () => {
    await render(
      <Card>
        <Text>Rex</Text>
      </Card>,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });
```

Adapter les imports en tête du fichier : `fireEvent` doit venir de `@testing-library/react-native`.

Dans `app/src/components/ui/__tests__/index.test.tsx`, ajouter `'Avatar'` et `'Badge'` au tableau `expected`.

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

```bash
cd app && npx jest card index
```

Attendu : ÉCHEC — `Card` ne rend jamais de bouton ; le barrel n'exporte ni `Avatar` ni `Badge`.

- [ ] **Step 3: Rendre `Card` pressable**

Dans `app/src/components/ui/card.tsx`, ajouter à `CardProps` :

```tsx
  /** Rend la carte actionnable. Absent → carte statique, non annoncée comme bouton. */
  onPress?: () => void;
  /** Nom accessible, requis en pratique dès que `onPress` est fourni. */
  accessibilityLabel?: string;
```

Puis, dans le composant, extraire la classe commune et brancher les deux formes — même structure que `ListRow`, pour que les deux composants se comportent pareil :

```tsx
export function Card({
  children,
  elevated = false,
  onPress,
  accessibilityLabel,
  className,
  testID,
}: CardProps) {
  const layout = `gap-3 rounded-lg border border-border p-4 ${
    elevated ? 'bg-surface-elevated' : 'bg-surface'
  } ${className ?? ''}`;

  if (!onPress) {
    return (
      <View testID={testID} className={layout}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      className={`${layout} active:bg-surface-sunken`}>
      {children}
    </Pressable>
  );
}
```

Ajouter `Pressable` à l'import `react-native`.

- [ ] **Step 4: Exporter les nouveaux composants**

Dans `app/src/components/ui/index.ts`, ajouter (en gardant l'ordre alphabétique existant) :

```ts
export { Avatar, type AvatarProps, type AvatarSize } from './avatar';
export { Badge, type BadgeProps, type BadgeTone } from './badge';
```

- [ ] **Step 5: Lancer les tests**

```bash
cd app && npm test
```

Attendu : toute la suite passe, y compris les nouveaux tests `Card` et le test du barrel.

- [ ] **Step 6: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 7: Commit**

```bash
cd app
git add src/components/ui/card.tsx src/components/ui/index.ts src/components/ui/__tests__/card.test.tsx src/components/ui/__tests__/index.test.tsx
git commit -m "feat: rendre Card pressable et exporter Avatar et Badge"
```

---

# Partie B — Lot 3 : migration des écrans

## Méthode commune à toutes les tâches de migration

Chaque tâche de migration suit le même protocole. Il n'est écrit qu'une fois, ici ; chaque tâche y renvoie.

**Table de correspondance — à appliquer partout :**

| Motif actuel | Remplacer par |
|---|---|
| `<Pressable className="rounded-xl bg-blue-600 py-3 …">` + `ActivityIndicator`/`Text` | `<Button label variant="primary" loading onPress />` |
| `<Pressable className="… border border-gray-300 …">` | `<Button variant="secondary" />` |
| `<Pressable className="… border border-red-300 …">` | `<Button variant="destructive" />` |
| Lien textuel pressable (bleu, sans fond) | `<Button variant="ghost" />` |
| `<TextInput className="rounded-xl border …" placeholder="X" placeholderTextColor="#9ca3af" />` | `<Input label="X" placeholder=… />` — le placeholder devient un **label visible** |
| `<View className="… rounded-xl border border-gray-200 …">` (bloc de section) | `<Card>` |
| Ligne de liste pressable (icône + titre + sous-titre) | `<ListRow leading title subtitle onPress />` |
| Cercle photo + repli emoji 🐾 | `<Avatar uri size label />` |
| Emoji de type d'événement + libellé | `<Badge label icon tone />` |
| `<ActivityIndicator />` centré, plein écran | `<Skeleton variant count />` |
| Texte d'erreur rouge plein écran | `<ErrorState message onRetry />` — **le retry est obligatoire** |
| Texte « Aucun … » seul | `<EmptyState icon title message actionLabel onAction />` |
| Bouton flottant `+` | `<FAB icon="add" label onPress />` |
| Confirmation inline après sauvegarde | `useToast().show(…)` |
| `bg-white dark:bg-black` | `bg-surface` |
| `text-black dark:text-white` | `text-text` |
| `text-gray-500 dark:text-gray-400` | `text-text-secondary` |
| `border-gray-200/300 dark:border-gray-700/800` | `border-border` |
| `text-red-600 dark:text-red-400` | `text-danger` |
| `text-blue-600` | `text-primary` |
| `text-3xl` / `text-lg` / `text-base` / `text-sm` / `text-xs` | `text-display` / `text-title` ou `text-headline` / `text-body` / `text-callout` / `text-caption` |

**Critères d'acceptation, identiques pour chaque écran migré :**

1. `grep -nE "#[0-9a-fA-F]{3,6}|dark:|bg-(blue|gray|red|green|orange)-[0-9]" <fichier>` ne retourne **rien**.
2. Aucun emoji dans le fichier (hors texte de marque explicitement toléré).
3. Aucun `Pressable`/`TextInput` brut là où un composant de la librairie existe.
4. Comportement identique : mêmes appels API, même navigation, mêmes règles de validation, mêmes messages d'erreur (le texte des messages ne change pas).
5. `npx tsc --noEmit`, `npm run lint`, `npm test` verts.

**Vérification obligatoire à chaque tâche** — les tests ne prouvent pas le rendu :

```bash
cd app && npx expo start --clear
```

Le simulateur iOS est déjà démarré. Charger l'app :

```bash
xcrun simctl openurl booted "exp://127.0.0.1:8081"
```

Puis naviguer jusqu'à l'écran migré, **le regarder**, et le regarder aussi en thème sombre :

```bash
xcrun simctl ui booted appearance dark
# … capture / observation …
xcrun simctl ui booted appearance light
```

Une capture d'écran vide, un texte invisible ou une icône noire sur fond sombre sont des échecs. Rapporter ce qui a été **observé**, jamais ce qui est supposé.

> Note : si la machine n'a pas d'IP LAN, `exp://127.0.0.1:8081` fonctionne — le simulateur tourne sur la même machine.

---

## Task 4: Fondations d'écran — provider, tab bar, renommage

Aucun écran migré ne fonctionne sans ces trois prérequis. Tâche courte mais bloquante pour toutes les suivantes.

**Files:**
- Modify: `app/src/app/_layout.tsx`
- Modify: `app/src/components/app-tabs.tsx`
- Rename: `app/src/app/(app)/explore.tsx` → `app/src/app/(app)/settings.tsx`

**Interfaces:**
- Produit : `useToast()` devient utilisable depuis n'importe quel écran (Tasks 8-13 en dépendent).

- [ ] **Step 1: Monter le `ToastProvider`**

Dans `app/src/app/_layout.tsx`, envelopper le contenu du `ThemeProvider` avec `ToastProvider` (importé depuis `@/components/ui`). Le provider doit être **à l'intérieur** du `ThemeProvider` et **englober** `RootNavigator`, pour que tout écran puisse appeler `useToast()`.

- [ ] **Step 2: Renommer l'écran Réglages**

```bash
cd app && git mv "src/app/(app)/explore.tsx" "src/app/(app)/settings.tsx"
```

`explore.tsx` est un reliquat du template Expo alors que l'écran affiche les réglages. Le renommer change la route : `/explore` → `/settings`.

- [ ] **Step 3: Corriger la tab bar**

Dans `app/src/components/app-tabs.tsx` : le `Trigger` `name="explore"` devient `name="settings"`, et les trois onglets reçoivent des icônes **distinctes** (aujourd'hui « Mes animaux » et « Réglages » partagent `explore.png`).

Remplacer les `<NativeTabs.Trigger.Icon src={require(...)} />` par des icônes SF Symbols via la prop `sf` de `NativeTabs.Trigger.Icon` — consulter `https://docs.expo.dev/versions/v56.0.0/` pour la signature exacte de `expo-router/unstable-native-tabs` dans le SDK 56 **avant** d'écrire ce code. Correspondance voulue : Home → maison, Mes animaux → patte, Réglages → engrenage.

Si l'API n'accepte pas de symbole système et exige un asset image, garder `require(...)` mais fournir **trois fichiers distincts** et le signaler dans le rapport.

- [ ] **Step 4: Vérifier qu'aucune référence à l'ancienne route ne subsiste**

```bash
cd app && grep -rn "explore" src/ --include=*.tsx --include=*.ts
```

Attendu : plus aucune occurrence liée à la route (les fichiers `app-tabs.web.tsx` et les assets peuvent en contenir — les traiter aussi).

- [ ] **Step 5: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 6: Vérification visuelle**

Suivre le protocole de la section « Méthode commune ». Confirmer : les trois onglets ont des icônes différentes, l'onglet Réglages ouvre bien l'écran, l'app démarre sans erreur de route.

- [ ] **Step 7: Commit**

```bash
cd app
git add -A
git commit -m "feat: monter le provider de toast et corriger la barre d'onglets"
```

---

## Task 5: Écrans d'authentification (`sign-in`, `sign-up`)

Deux écrans jumeaux, même structure : titre, sous-titre, champs, erreur, bouton de soumission, lien vers l'autre écran.

**Files:**
- Modify: `app/src/app/sign-in.tsx`
- Modify: `app/src/app/sign-up.tsx`

- [ ] **Step 1: Migrer `sign-in.tsx`**

Appliquer la table de correspondance. Points spécifiques :
- Les deux `TextInput` deviennent `<Input label="Email" …>` et `<Input label="Mot de passe" …>`. **Conserver** `autoCapitalize`, `autoComplete`, `keyboardType`, `secureTextEntry`, `onSubmitEditing` — ce sont des comportements, pas du style.
- « Mot de passe oublié ? » devient `<Button variant="ghost" label="Mot de passe oublié ?" onPress={() => router.push('/forgot-password')} />`.
- Le bouton principal devient `<Button label="Se connecter" loading={submitting} onPress={onSubmit} />` — la gestion `ActivityIndicator`/`disabled` est déjà dans le composant, la supprimer de l'écran.
- L'erreur passe par la prop `error` de l'`Input` concerné si elle vise un champ ; sinon elle reste un texte `text-danger`.
- `KeyboardAvoidingView` et sa logique `Platform.OS` **restent inchangés**.

- [ ] **Step 2: Migrer `sign-up.tsx`**

Même traitement, avec trois champs (email, mot de passe, confirmation). La validation (longueur ≥ 8, correspondance des mots de passe) **ne change pas**.

- [ ] **Step 3: Contrôler les critères d'acceptation**

```bash
cd app && grep -nE "#[0-9a-fA-F]{3,6}|dark:|bg-(blue|gray|red|green)-[0-9]" src/app/sign-in.tsx src/app/sign-up.tsx
```

Attendu : aucune sortie.

- [ ] **Step 4: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 5: Vérification visuelle**

Protocole de la « Méthode commune ». L'écran de connexion est l'écran d'accueil quand la session est absente — donc directement visible. Vérifier en clair **et** en sombre : labels visibles au-dessus des champs, bouton teal, lien fantôme lisible.

- [ ] **Step 6: Commit**

```bash
cd app
git add src/app/sign-in.tsx src/app/sign-up.tsx
git commit -m "refactor: migrer les ecrans de connexion et d'inscription sur la librairie UI"
```

---

## Task 6: Écrans de mot de passe (`forgot-password`, `reset-password`)

**Files:**
- Modify: `app/src/app/forgot-password.tsx`
- Modify: `app/src/app/reset-password.tsx`

- [ ] **Step 1: Lire les deux écrans avant de les modifier**

Ils n'ont pas été détaillés dans l'audit initial. Lire leur contenu et relever leurs motifs avant d'appliquer la table de correspondance.

- [ ] **Step 2: Migrer les deux écrans**

Appliquer la table. Les messages de confirmation inline (« email envoyé », etc.) deviennent `useToast().show(...)` **uniquement si** l'écran navigue ensuite ; s'ils restent affichés à l'écran comme information persistante, les garder en texte et n'en changer que les classes.

- [ ] **Step 3: Contrôler les critères d'acceptation**

```bash
cd app && grep -nE "#[0-9a-fA-F]{3,6}|dark:|bg-(blue|gray|red|green)-[0-9]" src/app/forgot-password.tsx src/app/reset-password.tsx
```

Attendu : aucune sortie.

- [ ] **Step 4: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 5: Vérification visuelle**

Protocole commun ; atteindre les écrans depuis « Mot de passe oublié ? » sur l'écran de connexion.

- [ ] **Step 6: Commit**

```bash
cd app
git add src/app/forgot-password.tsx src/app/reset-password.tsx
git commit -m "refactor: migrer les ecrans de mot de passe sur la librairie UI"
```

---

## Task 7: Formulaire d'événement de santé (composant partagé)

Migré **avant** les écrans qui le consomment (Tasks 9 et 10), pour qu'ils héritent d'un formulaire déjà propre.

**Files:**
- Modify: `app/src/components/health-event-form.tsx`
- Modify: `app/src/lib/health-events.ts`

- [ ] **Step 1: Remplacer les emoji par des noms d'icônes**

Dans `app/src/lib/health-events.ts`, remplacer la table `EVENT_EMOJI` par une table de noms d'icônes de la librairie :

```ts
import type { IconName } from '@/components/ui';

export const EVENT_ICONS: Record<HealthEventType, IconName> = {
  VACCINE: 'vaccine',
  TREATMENT: 'treatment',
  VISIT: 'visit',
};
```

Supprimer `EVENT_EMOJI`. `EVENT_LABELS`, `EVENT_TYPES` et `formatDate` **ne changent pas**.

> `EVENT_EMOJI` est référencé par la fiche animal (Task 11) — cette tâche la casse temporairement. C'est attendu : la Task 11 la répare. Si `tsc` échoue sur ce seul point à la fin de cette tâche, le signaler et corriger l'appel dans la fiche animal dans le même commit, en se limitant à cette ligne.

- [ ] **Step 2: Migrer le formulaire**

Dans `health-event-form.tsx` :
- Le sélecteur de type (trois `Pressable` en ligne) devient `<SegmentedControl options={…} value={type} onChange={…} />`, construit depuis `EVENT_TYPES` et `EVENT_LABELS`.
- Les six `TextInput` deviennent des `<Input label=… />`. Les placeholders actuels deviennent les labels : « Titre », « Date », « Dosage », « Vétérinaire », « Prochain rappel », « Notes ». Les précisions de format restent en `placeholder` (ex. label « Date », placeholder « AAAA-MM-JJ »).
- Le champ Notes garde `multiline`.
- Le bouton devient `<Button label={submitLabel} loading={submitting} onPress={handleSubmit} />`.
- **La validation ne change pas** : `isValidDate`, les messages, l'ordre des contrôles restent identiques. Les dates restent saisies en texte — le sélecteur de date natif est le Lot 4, hors périmètre.
- L'erreur globale peut être rattachée au champ concerné via la prop `error` de l'`Input` quand le message le désigne clairement (« Titre requis » → champ Titre).

- [ ] **Step 3: Contrôler les critères d'acceptation**

```bash
cd app && grep -nE "#[0-9a-fA-F]{3,6}|dark:|bg-(blue|gray|red|green)-[0-9]" src/components/health-event-form.tsx
grep -rn "EVENT_EMOJI" src/
```

Attendu : aucune sortie pour les deux.

- [ ] **Step 4: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 5: Vérification visuelle**

Protocole commun ; atteindre le formulaire via un animal → « + Événement ». Vérifier en clair et en sombre : segmented control lisible, labels au-dessus des champs, zone de notes assez haute.

- [ ] **Step 6: Commit**

```bash
cd app
git add src/components/health-event-form.tsx src/lib/health-events.ts
git commit -m "refactor: migrer le formulaire d'evenement de sante sur la librairie UI"
```

---

## Task 8: Liste des animaux

Premier écran avec les trois états (chargement, vide, erreur) — c'est ici que le bénéfice de la librairie devient visible.

**Files:**
- Modify: `app/src/app/(app)/animals/index.tsx`

- [ ] **Step 1: Migrer l'écran**

- Chargement (`animals === null`) : `<Skeleton variant="row" count={4} />` dans le conteneur de liste, au lieu de l'`ActivityIndicator` centré.
- Erreur : `<ErrorState message={error} onRetry={load} />`. **`load` doit être passé** — l'écran actuel est un cul-de-sac sans retour possible.
- Liste vide : `<EmptyState icon="paw" title="Aucun animal" message="Ajoutez votre premier compagnon pour commencer son carnet." actionLabel="Ajouter un animal" onAction={() => router.push('/animals/new')} />`.
- Chaque ligne : `<ListRow leading={<Avatar uri={item.photoUrl} label={…} />} title={item.name} subtitle={item.species} onPress={…} />`. Le `Link asChild` peut être conservé si `ListRow` fonctionne en enfant de `Link` ; sinon utiliser `onPress` + `router.push`. Choisir la forme qui marche et le dire dans le rapport.
- Le bouton flottant devient `<FAB icon="add" label="Ajouter un animal" onPress={…} className="absolute right-6" />` avec le `style={{ bottom: insets.bottom + 24 }}` conservé (l'inset est une valeur runtime, pas une classe).
- Ajouter le **pull-to-refresh** : `RefreshControl` sur la `FlatList`, appelant `load`.

- [ ] **Step 2: Contrôler les critères d'acceptation**

```bash
cd app && grep -nE "#[0-9a-fA-F]{3,6}|dark:|bg-(blue|gray|red|green)-[0-9]" "src/app/(app)/animals/index.tsx"
```

Attendu : aucune sortie.

- [ ] **Step 3: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 4: Vérification visuelle**

Protocole commun. **Observer les trois états** : couper l'API (`api/` arrêtée) pour voir l'état d'erreur et son bouton Réessayer ; avec un compte sans animal, voir l'état vide et son CTA. Vérifier en clair et en sombre.

- [ ] **Step 5: Commit**

```bash
cd app
git add "src/app/(app)/animals/index.tsx"
git commit -m "refactor: migrer la liste des animaux sur la librairie UI"
```

---

## Task 9: Création d'animal + création d'événement

Deux écrans courts, tous deux de simples enveloppes autour d'un formulaire.

**Files:**
- Modify: `app/src/app/(app)/animals/new.tsx`
- Modify: `app/src/app/(app)/animals/[id]/events/new.tsx`

- [ ] **Step 1: Migrer `animals/new.tsx`**

Deux `Input` (« Nom », « Espèce »), un `Button`. Ajouter une confirmation : après `api.createAnimal` réussi, `useToast().show('Animal ajouté')` **avant** `router.back()`.

L'espèce reste un champ texte libre — le sélecteur avec suggestions est le Lot 4.

- [ ] **Step 2: Migrer `events/new.tsx`**

Cet écran n'est qu'un `ScrollView` autour de `HealthEventForm` (déjà migré en Task 7). Remplacer `bg-white dark:bg-black` par `bg-surface`. Ajouter `useToast().show('Événement ajouté')` après création réussie.

- [ ] **Step 3: Contrôler les critères d'acceptation**

```bash
cd app && grep -nE "#[0-9a-fA-F]{3,6}|dark:|bg-(blue|gray|red|green)-[0-9]" "src/app/(app)/animals/new.tsx" "src/app/(app)/animals/[id]/events/new.tsx"
```

Attendu : aucune sortie.

- [ ] **Step 4: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 5: Vérification visuelle**

Protocole commun. **Créer réellement un animal** et confirmer que le toast apparaît, qu'il ne bloque pas les taps, et qu'il disparaît seul. Vérifier en clair et en sombre.

- [ ] **Step 6: Commit**

```bash
cd app
git add "src/app/(app)/animals/new.tsx" "src/app/(app)/animals/[id]/events/new.tsx"
git commit -m "refactor: migrer les ecrans de creation sur la librairie UI"
```

---

## Task 10: Édition d'événement + écran de scan

**Files:**
- Modify: `app/src/app/(app)/animals/[id]/events/[eventId].tsx`
- Modify: `app/src/app/(app)/animals/[id]/events/scan.tsx`

- [ ] **Step 1: Migrer l'édition d'événement**

- Chargement : `<Skeleton variant="card" count={1} />`.
- Erreur : `<ErrorState message={error} onRetry={…} />` avec un vrai rechargement.
- Le bouton Supprimer devient `<Button label="Supprimer" variant="destructive" icon="trash" onPress={onDelete} />`. **L'`Alert.alert` de confirmation reste inchangé** — c'est une garde métier sur une action irréversible.
- Toast après mise à jour réussie.

- [ ] **Step 2: Migrer l'écran de scan**

- Le bouton « Prendre une photo » devient `<Button label="Prendre une photo" icon="camera" onPress={onTakePhoto} />` (emoji 📷 supprimé).
- « Choisir depuis la galerie » devient `<Button variant="secondary" label="Choisir depuis la galerie" onPress={onPickFromLibrary} />`.
- L'état « analyse en cours » devient `<Skeleton variant="card" count={1} />` accompagné du texte existant, ou reste un `ActivityIndicator` avec son texte — au choix, mais sans classes codées en dur.
- L'état « fonctionnalité indisponible » (quand `AI_EXTRACTION_ENABLED` est faux) devient `<EmptyState icon="camera" title="Extraction indisponible" message=… />`.
- **`AI_EXTRACTION_ENABLED` reste faux et l'écran garde son comportement.** Ne pas réactiver l'extraction IA.

- [ ] **Step 3: Contrôler les critères d'acceptation**

```bash
cd app && grep -nE "#[0-9a-fA-F]{3,6}|dark:|bg-(blue|gray|red|green)-[0-9]" "src/app/(app)/animals/[id]/events/[eventId].tsx" "src/app/(app)/animals/[id]/events/scan.tsx"
```

Attendu : aucune sortie. Vérifier aussi l'absence d'emoji.

- [ ] **Step 4: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 5: Vérification visuelle**

Protocole commun. L'écran de scan est atteignable par lien direct même avec le drapeau à faux : `xcrun simctl openurl booted "exp://127.0.0.1:8081/--/animals/<id>/events/scan"`.

- [ ] **Step 6: Commit**

```bash
cd app
git add "src/app/(app)/animals/[id]/events/[eventId].tsx" "src/app/(app)/animals/[id]/events/scan.tsx"
git commit -m "refactor: migrer l'edition d'evenement et le scan sur la librairie UI"
```

---

## Task 11: Fiche animal

L'écran le plus chargé : un seul `ScrollView` mêlant photo, formulaire d'édition, export, suppression et timeline. La migration inclut sa **structuration en sections**, comme prévu au design doc §4.

**Files:**
- Modify: `app/src/app/(app)/animals/[id]/index.tsx`

- [ ] **Step 1: Structurer en trois `Card`**

Réorganiser le contenu en trois sections, sans changer la logique :

1. **Profil** — `<Avatar uri={animal.photoUrl} size="lg" />` pressable pour changer la photo, plus les `Input` « Nom » et « Espèce » et le bouton Enregistrer.
2. **Actions** — export PDF (`<Button variant="secondary" icon="document" label="Exporter le carnet (PDF)" loading={exporting} />`) et suppression (`<Button variant="destructive" icon="trash" label="Supprimer" />`).
3. **Carnet de santé** — l'en-tête avec les boutons Scanner/Événement, puis la timeline.

- [ ] **Step 2: Migrer la timeline**

Chaque événement devient :

```tsx
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
  onPress={…}
/>
```

Utiliser `EVENT_ICONS` (Task 7), plus `EVENT_EMOJI` qui n'existe plus.

- [ ] **Step 3: Traiter les états**

- Chargement (`animal === null`) : `<Skeleton variant="card" count={2} />`.
- Erreur de chargement : `<ErrorState message={error} onRetry={load} />`.
- Timeline vide : `<EmptyState icon="document" title="Aucun événement" message="Ajoutez un vaccin, un traitement ou une visite." actionLabel="Ajouter un événement" onAction={…} />`.
- Toast après enregistrement réussi — l'écran actuel ne confirme rien du tout.
- L'`Alert.alert` de suppression **reste inchangé**.

- [ ] **Step 4: Contrôler les critères d'acceptation**

```bash
cd app && grep -nE "#[0-9a-fA-F]{3,6}|dark:|bg-(blue|gray|red|green|orange)-[0-9]" "src/app/(app)/animals/[id]/index.tsx"
```

Attendu : aucune sortie. Vérifier aussi l'absence d'emoji (🐾 📄 📷 💉 💊 🩺).

- [ ] **Step 5: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 6: Vérification visuelle**

Protocole commun. Ouvrir un animal ayant **au moins un événement avec rappel**, pour voir les deux badges. Vérifier en clair et en sombre — c'est l'écran le plus dense, donc celui où une icône illisible se verrait le plus.

- [ ] **Step 7: Commit**

```bash
cd app
git add "src/app/(app)/animals/[id]/index.tsx"
git commit -m "refactor: migrer et structurer la fiche animal"
```

---

## Task 12: Réglages et accueil

Les deux derniers écrans. L'accueil est aussi restructuré, comme prévu au design doc §4.

**Files:**
- Modify: `app/src/app/(app)/settings.tsx`
- Modify: `app/src/app/(app)/index.tsx`

- [ ] **Step 1: Migrer les réglages**

- Les délais de rappel deviennent des `<Chip label={leadDayLabel(day)} selected={…} onPress={…} />`.
- Le bouton Enregistrer devient `<Button loading={saving} />`.
- La confirmation inline « Réglages enregistrés ✓ » est **remplacée** par `useToast().show('Réglages enregistrés')` — supprimer l'état `saved` devenu inutile.
- Chargement : `<Skeleton />`. Erreur : `<ErrorState … onRetry />`.
- **Déplacer la déconnexion ici**, dans une `Card` « Compte » : `<Button label="Se déconnecter" variant="destructive" onPress={signOut} />`.

- [ ] **Step 2: Migrer l'accueil**

- Retirer le bouton « Se déconnecter » (déplacé aux réglages à l'étape précédente) et le bloc « Connecté ✓ », qui n'apporte rien.
- L'onboarding reste, dans une `Card`, avec les emoji remplacés par des `<Icon>` : « Ajoutez vos animaux » → `paw`, « Tenez le carnet à jour » → `document`, « Ne ratez plus un rappel » → `bell`. La logique `ONBOARDING_SEEN_KEY` et le drapeau `AI_EXTRACTION_ENABLED` **ne changent pas**.
- À la place du bloc supprimé, afficher un raccourci utile : un `<Button label="Voir mes animaux" onPress={() => router.push('/animals')} />`. Ne pas ajouter d'appel API nouveau — le tableau de bord des échéances est hors périmètre de ce plan.

- [ ] **Step 3: Contrôler les critères d'acceptation**

```bash
cd app && grep -nE "#[0-9a-fA-F]{3,6}|dark:|bg-(blue|gray|red|green)-[0-9]" "src/app/(app)/settings.tsx" "src/app/(app)/index.tsx"
```

Attendu : aucune sortie. Vérifier aussi l'absence d'emoji hors titre de marque.

- [ ] **Step 4: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 5: Vérification visuelle**

Protocole commun. Enregistrer réellement un réglage pour voir le toast. Vérifier que la déconnexion fonctionne toujours depuis son nouvel emplacement. Clair et sombre.

- [ ] **Step 6: Commit**

```bash
cd app
git add "src/app/(app)/settings.tsx" "src/app/(app)/index.tsx"
git commit -m "refactor: migrer les reglages et l'accueil sur la librairie UI"
```

---

## Task 13: Balayage final

Vérifier que la migration est complète, plutôt que de le supposer.

**Files:**
- Modify: tout fichier que le balayage révèle non conforme.

- [ ] **Step 1: Chercher les couleurs et variantes résiduelles**

```bash
cd app && grep -rnE "#[0-9a-fA-F]{3,6}|dark:|bg-(blue|gray|red|green|orange)-[0-9]|text-(blue|gray|red|green|orange)-[0-9]" src/app/ src/components/ --include=*.tsx | grep -v "__tests__"
```

Attendu : aucune sortie, **sauf** les exceptions légitimes suivantes, qui doivent être justifiées une par une dans le rapport :
- `src/components/ui/fab.tsx` — `shadowColor: '#000'` (les ombres sont noires par convention dans les deux thèmes).
- Tout usage de `Colors[...]` en JS pour une prop qui n'accepte pas de classe (`placeholderTextColor`, `color` d'`Icon`).

- [ ] **Step 2: Chercher les emoji résiduels**

```bash
cd app && grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src/app/ src/components/ --include=*.tsx | grep -v "__tests__"
```

Traiter chaque occurrence, ou la justifier (texte de marque).

- [ ] **Step 3: Chercher les primitives brutes restantes**

```bash
cd app && grep -rn "<TextInput\|ActivityIndicator" src/app/ --include=*.tsx
```

Chaque occurrence doit avoir une raison : soit le composant de la librairie ne couvre pas le cas, soit c'est un oubli. Corriger les oublis.

- [ ] **Step 4: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint && npm test
```

- [ ] **Step 5: Parcours complet dans le simulateur**

Protocole commun, mais sur **tout le parcours** : connexion → liste → création d'animal → fiche → ajout d'événement → réglages → déconnexion. En clair **et** en sombre. Noter tout écart visuel.

- [ ] **Step 6: Commit**

```bash
cd app
git add -A
git commit -m "refactor: finaliser la migration UI des ecrans"
```

---

## Self-Review

**1. Couverture du design doc §4 (Lot 3) :**

| Exigence | Tâche |
|---|---|
| Remplacer tout motif inline par les composants | Tasks 5-12, contrôlé en Task 13 |
| Aucune couleur codée en dur ni `dark:` | Critère d'acceptation de chaque tâche + balayage Task 13 |
| Renommer `explore.tsx` → `settings.tsx` | Task 4 |
| Accueil : retirer la déconnexion, remplacer le bloc de statut | Task 12 |
| Fiche animal : séparer en sections `Card` | Task 11 |
| Monter le `ToastProvider` | Task 4 |
| Icônes de tab bar distinctes | Task 4 |
| Icônes à la place des emoji | Tasks 7, 10, 11, 12 ; balayage Task 13 |
| Skeletons / empty states / error states avec retry | Tasks 8, 10, 11, 12 |
| Pull-to-refresh | Task 8 |
| Toasts de confirmation | Tasks 9, 11, 12 |

Comblé au passage, depuis les lacunes remontées par la review finale du plan précédent : `Avatar` (Task 1), `Badge` (Task 2), `Card` pressable (Task 3).

**Hors périmètre, assumé :** sélecteurs de date natifs et picker d'espèce (Lot 4) ; haptique et animations (Lot 6) ; tableau de bord des échéances sur l'accueil ; réactivation de l'extraction IA. `SegmentedControl.value` reste `string` — le rendre générique n'est pas nécessaire à la migration et modifierait une API déjà consommée.

**2. Placeholders :** aucun « TBD ». Les deux endroits où le plan ne fige pas le code sont explicites et justifiés : l'API d'icônes de `NativeTabs` (Task 4 Step 3, à confirmer dans les docs versionnées avant écriture) et le contenu de `forgot-password`/`reset-password` (Task 6 Step 1, écrans non couverts par l'audit initial — à lire d'abord).

**3. Cohérence des noms :** `EVENT_ICONS` est introduit en Task 7 et consommé en Task 11 ; `EVENT_EMOJI` est supprimé en Task 7, ce qui casse temporairement la fiche animal — signalé dans la tâche avec sa résolution. `Avatar`/`Badge`/`Card.onPress` sont produits en Tasks 1-3 et consommés en Tasks 8 et 11. Le barrel est mis à jour en Task 3, avant tout usage.

**4. Risque connu :** `ListRow` en enfant de `Link asChild` (Task 8) n'est pas garanti — la tâche demande d'essayer, de basculer sur `onPress` + `router.push` sinon, et de le dire. Aucune des deux formes ne change le comportement de navigation.
