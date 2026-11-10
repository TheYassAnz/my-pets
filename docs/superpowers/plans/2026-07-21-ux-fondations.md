# Refonte UX — Fondations (Lot 1 + Lot 2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser le design system (tokens sémantiques light/dark + typographie) et la librairie de composants sur-mesure NativeWind qui remplacera tous les patterns copiés-collés de l'app mobile.

**Architecture:** Les tokens sont des variables CSS définies dans `src/global.css` (`:root` pour le light, `@media (prefers-color-scheme: dark)` pour le dark) et exposées comme couleurs Tailwind dans `tailwind.config.js` via `rgb(var(--x) / <alpha-value>)`. Conséquence : un écran écrit `bg-surface` et obtient automatiquement le bon fond dans les deux thèmes — plus aucune variante `dark:` manuelle. Les composants vivent dans `src/components/ui/`, un fichier par composant, et ne consomment que ces tokens. Chaque composant porte lui-même son accessibilité (`accessibilityRole`, `accessibilityLabel`, cible ≥44pt) pour que les écrans n'aient pas à la refaire.

**Tech Stack:** Expo SDK 56 · React Native 0.85.3 · React 19.2.3 · NativeWind 4.2.6 · Tailwind CSS 3.4.19 · TypeScript 6 (strict) · jest-expo + @testing-library/react-native (à installer).

## Global Constraints

- Toutes les commandes s'exécutent depuis `app/` (racine du projet Expo).
- **Expo a changé** : lire les docs versionnées `https://docs.expo.dev/versions/v56.0.0/` avant d'écrire du code Expo (cf. `app/AGENTS.md`).
- Installer toute dépendance avec `npx expo install <pkg>` (jamais `npm install` direct) pour garantir la compatibilité SDK 56.
- TypeScript est en `strict: true`. Aucun `any` implicite.
- Alias d'import : `@/*` → `./src/*` (ex. `@/components/ui/button`).
- **Aucune couleur hardcodée** dans les composants : uniquement les tokens définis en Task 2. Aucune variante `dark:` manuelle.
- Tout élément interactif : hauteur minimale **44pt** (`min-h-11`) + `accessibilityRole` + nom accessible.
- Langue de l'UI : **français** (l'app est entièrement en français).
- **Git : `app/` est son propre dépôt** (tout comme `api/` ; la racine `my-pets/` n'en est pas un). Toutes les commandes git s'exécutent donc depuis `app/`. Branche de travail actuelle : `develop`, arbre propre au démarrage.
- **Convention de commit** : Conventional Commits, en français, comme l'historique existant (`feat: add scan events page for animals`). Committer à la fin de chaque tâche, jamais au milieu.
- Chaque tâche se termine par : vérification (`npx tsc --noEmit` + `npm run lint` + `npm test`) **puis** commit. Ne jamais committer avec des tests rouges.
- Périmètre : **uniquement `app/`**. Aucun changement API/backend. Ne pas réactiver l'extraction IA (reste derrière `AI_EXTRACTION_ENABLED`).
- **API de test — React Native Testing Library 14 (vérifié dans `node_modules` à la Task 1) :** `render()` et `fireEvent.*()` retournent des **Promises**.
  - `declare function render<T>(…): Promise<{…}>`
  - `var press: (instance, eventProps?) => Promise<void>`

  Donc **tout test est `async`**, et `render` comme `fireEvent` s'écrivent avec `await` :

  ```tsx
  it('fait quelque chose', async () => {
    await render(<Composant />);
    await fireEvent.press(screen.getByRole('button', { name: 'Valider' }));
    expect(...).toBe(...);
  });
  ```

  Oublier le `await` sur `render` **ne lève aucune erreur** : `screen` reste vide et les requêtes échouent de façon déroutante. C'est le piège principal de ce plan.
- **Types jest** : les globals (`describe`, `it`, `expect`, `jest`) sont fournis par un fichier de déclaration unique à la racine, `jest-env.d.ts` — même motif que le `nativewind-env.d.ts` déjà présent. **Ne pas** ajouter de `/// <reference types="jest" />` en tête de chaque fichier de test.
- Ce plan ne migre **aucun écran existant** — c'est le Lot 3, qui fera l'objet d'un plan séparé. Les écrans actuels continuent de fonctionner inchangés pendant tout ce plan.

---

## File Structure

**Créés :**

| Fichier | Responsabilité |
|---|---|
| `jest.config.js` | Config jest-expo (preset, setup, transformIgnorePatterns) |
| `jest-env.d.ts` | Globals jest pour TypeScript (motif `nativewind-env.d.ts`) |
| `src/components/ui/icon.tsx` | Wrapper unique d'icônes (remplace les emoji) |
| `src/components/ui/button.tsx` | Bouton 4 variants, états loading/disabled |
| `src/components/ui/input.tsx` | Champ texte avec label visible + erreur |
| `src/components/ui/card.tsx` | Conteneur de section |
| `src/components/ui/list-row.tsx` | Ligne de liste pressable (leading/title/subtitle/trailing) |
| `src/components/ui/segmented-control.tsx` | Sélecteur exclusif (type d'événement) |
| `src/components/ui/chip.tsx` | Pastille sélectionnable (délais de rappel) |
| `src/components/ui/fab.tsx` | Bouton d'action flottant |
| `src/components/ui/empty-state.tsx` | État vide avec CTA |
| `src/components/ui/error-state.tsx` | État d'erreur avec bouton Réessayer |
| `src/components/ui/skeleton.tsx` | Placeholder de chargement |
| `src/components/ui/toast.tsx` | Toast + provider global |
| `src/components/ui/index.ts` | Barrel export de la librairie |
| `src/components/ui/__tests__/*.test.tsx` | Tests de comportement + a11y, un par composant |

**Modifiés :**

| Fichier | Changement |
|---|---|
| `tailwind.config.js` | `theme.extend` : couleurs sémantiques, échelle typographique, radius |
| `src/global.css` | Variables CSS des tokens, light + dark |
| `src/constants/theme.ts` | `Colors` réaligné sur les tokens (la tab bar native lit ces valeurs JS) |
| `package.json` | Scripts `test`, `test:watch` + devDeps de test |

---

## Task 1: Infrastructure de test

Sans harnais de test, aucune tâche suivante n'est vérifiable. Cette tâche installe jest-expo + React Native Testing Library et prouve qu'un composant RN se rend et que les requêtes d'accessibilité fonctionnent.

**Files:**
- Create: `app/jest.config.js`
- Create: `app/jest-env.d.ts`
- Modify: `app/tsconfig.json` (ajouter `jest-env.d.ts` à `include`)
- Create: `app/src/components/ui/__tests__/harness.test.tsx`
- Modify: `app/package.json` (scripts `test`, `test:watch`)

**Interfaces:**
- Consumes: rien (première tâche).
- Produits: la commande `npm test` et le pattern de test `render` / `screen.getByRole` / `fireEvent.press` réutilisé par toutes les tâches suivantes.

- [ ] **Step 1: Installer les dépendances de test**

```bash
cd app
npx expo install jest-expo jest @testing-library/react-native --dev
```

Attendu : installation sans erreur de peer-dependency. Note la version de `jest-expo` installée — elle doit être alignée sur le SDK 56.

- [ ] **Step 2: Créer la configuration jest**

Créer `app/jest.config.js` :

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-css-interop))',
  ],
};
```

**Ne pas créer de `jest.setup.js`** et **ne pas** ajouter `setupFilesAfterEnv` : retirer ces deux lignes de la config ci-dessus si tu les as recopiées.

> Vérifié empiriquement : mocker `NativeAnimatedHelper` avec `{}` (le réflexe habituel pour « réduire le bruit ») **casse `Animated`** sous RN 0.85 — toute la chaîne `Animated → TouchableOpacity → Button` plante avec `TypeError: Cannot read properties of undefined (reading 'connectAnimatedNodes')`. Un harnais n'utilisant que `Pressable` ne le détecte pas ; l'explosion arrive plus tard, dans un composant quelconque. Sans ce mock, la suite est verte **et** la sortie est déjà propre — le mock ne réglait aucun problème réel.

Créer `app/jest-env.d.ts` (même motif que le `nativewind-env.d.ts` déjà présent) pour fournir les globals jest à TypeScript une seule fois, au lieu d'un `/// <reference types="jest" />` en tête de chaque test :

```ts
/// <reference types="jest" />
```

Puis déclarer ce fichier dans `app/tsconfig.json`, en l'ajoutant au tableau `include` (à côté de `"nativewind-env.d.ts"`) :

```json
    "nativewind-env.d.ts",
    "jest-env.d.ts"
```

- [ ] **Step 3: Ajouter les scripts npm**

Dans `app/package.json`, ajouter aux `scripts` :

```json
    "test": "jest",
    "test:watch": "jest --watch"
```

- [ ] **Step 4: Écrire le test de harnais (il doit échouer)**

Créer `app/src/components/ui/__tests__/harness.test.tsx` :

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

describe('harnais de test', () => {
  it('rend un composant et le trouve par son rôle accessible', async () => {
    await render(
      <Pressable accessibilityRole="button" accessibilityLabel="Valider">
        <Text>Valider</Text>
      </Pressable>,
    );

    expect(screen.getByRole('button', { name: 'Valider' })).toBeTruthy();
  });

  it('déclenche onPress', async () => {
    const onPress = jest.fn();
    await render(
      <Pressable accessibilityRole="button" accessibilityLabel="Valider" onPress={onPress}>
        <Text>Valider</Text>
      </Pressable>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Valider' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 5: Lancer les tests**

```bash
cd app && npm test
```

Attendu : **2 tests passent**. Si le run échoue sur une transformation de module (`SyntaxError: Cannot use import statement outside a module`), ajoute le paquet fautif à `transformIgnorePatterns` et relance.

- [ ] **Step 6: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

Attendu : aucune erreur.

- [ ] **Step 7: Commit**

```bash
cd app
git add jest.config.js jest-env.d.ts tsconfig.json package.json package-lock.json src/components/ui/__tests__/harness.test.tsx
git commit -m "test: mettre en place jest-expo et testing-library"
```

---

## Task 2: Tokens sémantiques de couleur (light + dark)

Le cœur du Lot 1. Après cette tâche, `bg-surface` / `text-text` / `bg-primary` existent et basculent seuls entre light et dark.

**Files:**
- Modify: `app/src/global.css`
- Modify: `app/tailwind.config.js`
- Modify: `app/src/constants/theme.ts`
- Create: `app/src/components/ui/__tests__/tokens.test.tsx`

**Interfaces:**
- Consumes: le harnais de test de Task 1.
- Produits: les classes utilitaires consommées par **toutes** les tâches suivantes —
  `bg-surface`, `bg-surface-elevated`, `bg-surface-sunken`, `border-border`,
  `text-text`, `text-text-secondary`, `text-text-tertiary`,
  `bg-primary`, `bg-primary-pressed`, `bg-primary-surface`, `text-primary`, `text-on-primary`,
  `text-danger` / `bg-danger` / `bg-danger-surface`, `text-success`, `text-warning`.
  Plus l'objet JS `Colors` (light/dark) exporté par `@/constants/theme` pour la tab bar native.

**Palette retenue : Direction A « Teal Santé »** (cf. design doc §2.2). Primaire light = `#0D9488` (teal-600), primaire dark = `#2DD4BF` (teal-400).

- [ ] **Step 1: Déclarer les variables CSS**

Remplacer le contenu de `app/src/global.css` par :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-display:
    Spline Sans, Inter, ui-sans-serif, system-ui, sans-serif, Apple Color Emoji, Segoe UI Emoji,
    Segoe UI Symbol, Noto Color Emoji;
  --font-mono:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace;
  --font-rounded: 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif;
  --font-serif: Georgia, 'Times New Roman', serif;
}

@layer base {
  /* Tokens sémantiques — thème clair.
     Valeurs en canaux RGB séparés par des espaces pour supporter <alpha-value>. */
  :root {
    --color-primary: 13 148 136;
    --color-primary-pressed: 15 118 110;
    --color-primary-surface: 240 253 250;
    --color-on-primary: 255 255 255;

    --color-surface: 255 255 255;
    --color-surface-elevated: 247 247 248;
    --color-surface-sunken: 240 240 243;
    --color-border: 227 227 231;

    --color-text: 11 11 12;
    --color-text-secondary: 96 100 108;
    --color-text-tertiary: 107 114 128;

    --color-danger: 220 38 38;
    --color-danger-surface: 254 242 242;
    --color-success: 22 163 74;
    --color-warning: 217 119 6;
  }

  /* Thème sombre : mêmes noms de tokens, autres valeurs. */
  @media (prefers-color-scheme: dark) {
    :root {
      --color-primary: 45 212 191;
      --color-primary-pressed: 20 184 166;
      --color-primary-surface: 12 46 43;
      --color-on-primary: 11 11 12;

      --color-surface: 11 11 12;
      --color-surface-elevated: 26 26 29;
      --color-surface-sunken: 33 34 37;
      --color-border: 46 49 53;

      --color-text: 245 245 247;
      --color-text-secondary: 176 180 186;
      --color-text-tertiary: 154 160 166;

      --color-danger: 248 113 113;
      --color-danger-surface: 59 22 20;
      --color-success: 74 222 128;
      --color-warning: 251 191 36;
    }
  }
}
```

- [ ] **Step 2: Exposer les tokens à Tailwind**

Remplacer le contenu de `app/tailwind.config.js` par :

```js
/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: token('primary'),
          pressed: token('primary-pressed'),
          surface: token('primary-surface'),
        },
        'on-primary': token('on-primary'),
        surface: {
          DEFAULT: token('surface'),
          elevated: token('surface-elevated'),
          sunken: token('surface-sunken'),
        },
        border: token('border'),
        text: {
          DEFAULT: token('text'),
          secondary: token('text-secondary'),
          tertiary: token('text-tertiary'),
        },
        danger: {
          DEFAULT: token('danger'),
          surface: token('danger-surface'),
        },
        success: token('success'),
        warning: token('warning'),
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};
```

> Note : `text` est à la fois une famille de couleurs (`text-text`, `text-text-secondary`) et le préfixe utilitaire Tailwind. C'est volontaire et fonctionne — `text-text` = couleur de texte principale.

- [ ] **Step 3: Réaligner `constants/theme.ts` sur les mêmes valeurs**

La tab bar native (`src/components/app-tabs.tsx`) lit des valeurs JS, pas des classes. Elles doivent correspondre aux tokens, sinon la tab bar dérive du reste de l'app.

Dans `app/src/constants/theme.ts`, remplacer l'objet `Colors` par :

```ts
// Doit rester synchronisé avec les variables CSS de src/global.css.
// `textTertiary` est indispensable : certaines props RN (placeholderTextColor)
// n'acceptent qu'une couleur résolue, jamais une classe Tailwind.
export const Colors = {
  light: {
    text: '#0B0B0C',
    background: '#FFFFFF',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E3E3E7',
    textSecondary: '#60646C',
    textTertiary: '#6B7280',
    primary: '#0D9488',
  },
  dark: {
    text: '#F5F5F7',
    background: '#0B0B0C',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    textTertiary: '#9AA0A6',
    primary: '#2DD4BF',
  },
} as const;
```

- [ ] **Step 4: Écrire le test de non-régression des tokens**

Ce test verrouille la parité light/dark : chaque token doit exister dans les deux thèmes. Créer `app/src/components/ui/__tests__/tokens.test.tsx` :

```tsx
import { Colors } from '@/constants/theme';

// Ces tests vérifient des invariants du thème, pas les valeurs elles-mêmes :
// verrouiller les hex ferait un test change-detector qui casse à chaque
// ajustement de palette sans rien attraper de réel.
describe('tokens de couleur', () => {
  it('expose les mêmes clés en light et en dark', async () => {
    // Une clé présente d'un seul côté = token invisible ou plantage dans un thème.
    expect(Object.keys(Colors.light).sort()).toEqual(Object.keys(Colors.dark).sort());
  });

  it('donne une valeur distincte à chaque token entre les deux thèmes', async () => {
    // Un token identique en light et dark trahit un oubli de calibrage.
    for (const key of Object.keys(Colors.light) as (keyof typeof Colors.light)[]) {
      expect(Colors.light[key]).not.toBe(Colors.dark[key]);
    }
  });
});
```

- [ ] **Step 5: Lancer les tests**

```bash
cd app && npm test
```

Attendu : les 2 tests de `tokens.test.tsx` passent (plus les 2 du harnais).

- [ ] **Step 6: Vérifier le rendu réel dans le simulateur**

Les tests unitaires ne prouvent pas que Tailwind résout les classes. Vérification visuelle obligatoire :

```bash
cd app && npx expo start --clear
```

Puis dans le simulateur iOS déjà booté (voir `xcrun simctl openurl booted "exp://<ip-lan>:8081"`), confirmer que l'app se charge **sans erreur de bundling**. Un token mal formé casse la compilation Tailwind — c'est le signal recherché.

- [ ] **Step 7: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

Attendu : aucune erreur.

- [ ] **Step 8: Commit**

```bash
cd app
git add tailwind.config.js src/global.css src/constants/theme.ts src/components/ui/__tests__/tokens.test.tsx
git commit -m "feat: ajouter les tokens de couleur sémantiques light/dark"
```

---

## Task 3: Échelle typographique

**Files:**
- Modify: `app/tailwind.config.js` (ajouter `fontSize` dans `theme.extend`)
- Create: `app/src/components/ui/__tests__/typography.test.tsx`

**Interfaces:**
- Consumes: `tailwind.config.js` de Task 2.
- Produits: les classes `text-display`, `text-title`, `text-headline`, `text-body`, `text-callout`, `text-caption` — utilisées par tous les composants suivants.

- [ ] **Step 1: Ajouter l'échelle à Tailwind**

Dans `app/tailwind.config.js`, à l'intérieur de `theme.extend`, ajouter la clé `fontSize` (à côté de `colors` et `borderRadius`) :

```js
      fontSize: {
        display: ['30px', { lineHeight: '36px' }],
        title: ['22px', { lineHeight: '28px' }],
        headline: ['17px', { lineHeight: '22px' }],
        body: ['16px', { lineHeight: '22px' }],
        callout: ['15px', { lineHeight: '20px' }],
        caption: ['13px', { lineHeight: '18px' }],
      },
```

- [ ] **Step 2: Écrire le test**

Créer `app/src/components/ui/__tests__/typography.test.tsx` :

```tsx
const config = require('../../../../tailwind.config.js');

// Un seul invariant testé : la forme de chaque entrée. Lister à nouveau les six
// noms serait recopier la config pour la comparer à elle-même.
// Pas de rendu ici : ce test reste synchrone (seuls les tests qui appellent
// `render`/`fireEvent` ont besoin d'être `async`).
describe('échelle typographique', () => {
  it('associe une interligne à chaque taille de texte', () => {
    const sizes = config.theme.extend.fontSize;

    expect(Object.keys(sizes).length).toBeGreaterThan(0);

    for (const [role, value] of Object.entries(sizes)) {
      // Forme attendue : ['16px', { lineHeight: '22px' }].
      // Une taille sans interligne casse le rythme vertical sans erreur visible.
      expect(Array.isArray(value)).toBe(true);
      expect(typeof (value as [string, object])[0]).toBe('string');
      expect((value as [string, { lineHeight?: string }])[1]?.lineHeight).toEqual(
        expect.stringMatching(/^\d+px$/),
      );
      expect(role).toMatch(/^[a-z]+$/);
    }
  });
});
```

- [ ] **Step 3: Lancer les tests**

```bash
cd app && npm test -- typography
```

Attendu : 1 test passe.

- [ ] **Step 4: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 5: Commit**

```bash
cd app
git add tailwind.config.js src/components/ui/__tests__/typography.test.tsx
git commit -m "feat: ajouter l'échelle typographique"
```

---

## Task 4: Composant `Icon`

Wrapper unique. Toutes les icônes de l'app passeront par lui — c'est ce qui permettra de supprimer les emoji au Lot 5 sans toucher aux écrans.

**Files:**
- Create: `app/src/components/ui/icon.tsx`
- Create: `app/src/components/ui/__tests__/icon.test.tsx`

**Interfaces:**
- Consumes: tokens de Task 2.
- Produits: `<Icon name={IconName} size?: number color?: string decorative?: boolean />` et le type `IconName`. Consommé par `Button`, `ListRow`, `FAB`, `EmptyState`, `ErrorState`, `Toast`.

- [ ] **Step 1: Installer la librairie d'icônes**

```bash
cd app && npx expo install @expo/vector-icons
```

- [ ] **Step 2: Écrire les tests (ils doivent échouer)**

Créer `app/src/components/ui/__tests__/icon.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react-native';

import { Icon } from '@/components/ui/icon';

describe('Icon', () => {
  it('expose un nom accessible quand il est porteur de sens', async () => {
    await render(<Icon name="paw" label="Animal" />);

    expect(screen.getByLabelText('Animal')).toBeTruthy();
  });

  it('est masqué aux lecteurs d’écran quand il est décoratif', async () => {
    // Inspecter les props de masquage, et non l'absence d'un label jamais passé :
    // sinon le test passe même si la branche décorative est cassée.
    await render(<Icon name="paw" decorative testID="deco" />);

    // `includeHiddenElements` est indispensable : RNTL 14 exclut par défaut les
    // nœuds masqués aux lecteurs d'écran. Devoir l'activer est en soi la preuve
    // que le masquage fonctionne.
    const node = screen.getByTestId('deco', { includeHiddenElements: true });
    expect(node.props.accessibilityElementsHidden).toBe(true);
    expect(node.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(node.props.accessibilityLabel).toBeUndefined();
  });
});
```

- [ ] **Step 3: Lancer les tests pour vérifier l'échec**

```bash
cd app && npm test -- icon
```

Attendu : ÉCHEC — `Cannot find module '@/components/ui/icon'`.

- [ ] **Step 4: Implémenter**

Créer `app/src/components/ui/icon.tsx` :

```tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Nommage métier stable : les écrans demandent « paw », pas « md-paw-outline ».
// Changer de set d'icônes ne touchera que ce fichier.
const IONICONS = {
  home: 'home-outline',
  settings: 'settings-outline',
  camera: 'camera-outline',
  document: 'document-text-outline',
  bell: 'notifications-outline',
  add: 'add',
  close: 'close',
  chevron: 'chevron-forward',
  check: 'checkmark-circle-outline',
  alert: 'alert-circle-outline',
  refresh: 'refresh',
  trash: 'trash-outline',
} as const;

const MATERIAL = {
  paw: 'paw',
  vaccine: 'needle',
  treatment: 'pill',
  visit: 'stethoscope',
} as const;

export type IconName = keyof typeof IONICONS | keyof typeof MATERIAL;

export type IconProps = {
  name: IconName;
  size?: number;
  /** Couleur résolue (hex/rgb). Par défaut : hérite via className sur le parent. */
  color?: string;
  /** Nom lu par VoiceOver/TalkBack. Requis si l'icône porte du sens. */
  label?: string;
  /** Icône purement visuelle : masquée aux lecteurs d'écran. */
  decorative?: boolean;
  /** Uniquement pour les tests : permet de cibler le nœud rendu. */
  testID?: string;
};

export function Icon({ name, size = 20, color, label, decorative = false, testID }: IconProps) {
  const a11y = decorative
    ? { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const }
    : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label };

  if (name in MATERIAL) {
    return (
      <MaterialCommunityIcons
        name={MATERIAL[name as keyof typeof MATERIAL]}
        size={size}
        color={color}
        testID={testID}
        {...a11y}
      />
    );
  }

  return (
    <Ionicons
      name={IONICONS[name as keyof typeof IONICONS]}
      size={size}
      color={color}
      testID={testID}
      {...a11y}
    />
  );
}
```

- [ ] **Step 5: Lancer les tests**

```bash
cd app && npm test -- icon
```

Attendu : 2 tests passent.

- [ ] **Step 6: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 7: Commit**

```bash
cd app
git add package.json package-lock.json src/components/ui/icon.tsx src/components/ui/__tests__/icon.test.tsx
git commit -m "feat: ajouter le composant Icon"
```

---

## Task 5: Composant `Button`

Remplace ~8 copies du même bloc `Pressable` + spinner. C'est le composant le plus réutilisé de la librairie.

**Files:**
- Create: `app/src/components/ui/button.tsx`
- Create: `app/src/components/ui/__tests__/button.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 2), typo (Task 3), `Icon`/`IconName` (Task 4).
- Produits: `<Button label variant? loading? disabled? icon? onPress? accessibilityLabel? />` avec `type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'`. Consommé par `EmptyState`, `ErrorState` et tous les écrans du Lot 3.

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

Créer `app/src/components/ui/__tests__/button.test.tsx` :

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('déclenche onPress au tap', async () => {
    const onPress = jest.fn();
    await render(<Button label="Enregistrer" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ne déclenche pas onPress quand il est désactivé', async () => {
    const onPress = jest.fn();
    await render(<Button label="Enregistrer" disabled onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('masque le libellé et se déclare occupé pendant le chargement', async () => {
    await render(<Button label="Enregistrer" loading />);

    expect(screen.queryByText('Enregistrer')).toBeNull();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer' }).props.accessibilityState).toMatchObject(
      { busy: true, disabled: true },
    );
  });

  it('ne déclenche pas onPress pendant le chargement', async () => {
    const onPress = jest.fn();
    await render(<Button label="Enregistrer" loading onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

```bash
cd app && npm test -- button
```

Attendu : ÉCHEC — `Cannot find module '@/components/ui/button'`.

- [ ] **Step 3: Implémenter**

Créer `app/src/components/ui/button.tsx` :

```tsx
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from './icon';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-primary-pressed',
  secondary: 'border border-border active:bg-surface-sunken',
  destructive: 'border border-danger active:bg-danger-surface',
  ghost: 'active:opacity-70',
};

const LABEL: Record<ButtonVariant, string> = {
  primary: 'text-on-primary',
  secondary: 'text-text',
  destructive: 'text-danger',
  ghost: 'text-primary',
};

export type ButtonProps = {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  onPress?: () => void;
  /** Remplace le libellé pour les lecteurs d'écran si le texte visible est ambigu. */
  accessibilityLabel?: string;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  onPress,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      className={`min-h-11 flex-row items-center justify-center gap-2 rounded-md px-4 py-3 ${
        CONTAINER[variant]
      } ${isDisabled ? 'opacity-50' : ''}`}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Icon name={icon} size={18} decorative /> : null}
          <Text className={`text-body font-semibold ${LABEL[variant]}`}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}
```

- [ ] **Step 4: Lancer les tests**

```bash
cd app && npm test -- button
```

Attendu : 4 tests passent.

- [ ] **Step 5: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 6: Commit**

```bash
cd app
git add src/components/ui/button.tsx src/components/ui/__tests__/button.test.tsx
git commit -m "feat: ajouter le composant Button"
```

---

## Task 6: Composant `Input`

Remplace ~15 copies de `TextInput`. Corrige deux constats d'audit d'un coup : label visible (au lieu du placeholder-comme-label) et contraste du placeholder (`text-tertiary` au lieu de `#9ca3af`).

**Files:**
- Create: `app/src/components/ui/input.tsx`
- Create: `app/src/components/ui/__tests__/input.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 2), typo (Task 3).
- Produits: `<Input label value onChangeText placeholder? error? multiline? ...TextInputProps />`, forwardRef vers le `TextInput` natif (nécessaire au chaînage clavier du Lot 4).

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

Créer `app/src/components/ui/__tests__/input.test.tsx` :

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('affiche un label visible', async () => {
    await render(<Input label="Nom" value="" onChangeText={jest.fn()} />);

    expect(screen.getByText('Nom')).toBeTruthy();
  });

  it('remonte la saisie', async () => {
    const onChangeText = jest.fn();
    await render(<Input label="Nom" value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Rex');

    expect(onChangeText).toHaveBeenCalledWith('Rex');
  });

  it('affiche le message d’erreur et l’intègre au nom accessible du champ', async () => {
    // React Native n'a pas d'équivalent de aria-invalid : le seul moyen fiable
    // d'annoncer l'erreur est de la joindre au libellé lu par le lecteur d'écran.
    await render(<Input label="Nom" value="" onChangeText={jest.fn()} error="Nom requis" />);

    expect(screen.getByText('Nom requis')).toBeTruthy();
    expect(screen.getByLabelText('Nom, erreur : Nom requis')).toBeTruthy();
  });

  it('n’affiche pas de zone d’erreur quand il n’y a pas d’erreur', async () => {
    await render(<Input label="Nom" value="" onChangeText={jest.fn()} />);

    expect(screen.queryByText('Nom requis')).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

```bash
cd app && npm test -- input
```

Attendu : ÉCHEC — module introuvable.

- [ ] **Step 3: Implémenter**

Créer `app/src/components/ui/input.tsx` :

```tsx
import { forwardRef } from 'react';
import { Text, TextInput, useColorScheme, View, type TextInputProps } from 'react-native';

import { Colors } from '@/constants/theme';

export type InputProps = Omit<TextInputProps, 'placeholderTextColor' | 'accessibilityLabel'> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, multiline, className, ...rest },
  ref,
) {
  // `placeholderTextColor` n'accepte qu'une couleur résolue : NativeWind ne mappe
  // pas `placeholderClassName` à l'exécution (il est typé mais ignoré en 4.2.6).
  // On lit donc le token depuis Colors, qui est synchronisé avec global.css.
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View className="gap-1.5">
      <Text className="text-caption font-medium text-text-secondary">{label}</Text>

      <TextInput
        ref={ref}
        // React Native n'a ni `aria-invalid` ni `accessibilityState.invalid` :
        // joindre l'erreur au libellé est le seul moyen de l'annoncer.
        accessibilityLabel={error ? `${label}, erreur : ${error}` : label}
        multiline={multiline}
        // Contraste conforme (≥4.5:1) : remplace l'ancien #9ca3af (~2.5:1).
        placeholderTextColor={colors.textTertiary}
        className={`min-h-11 rounded-md border px-4 py-3 text-body text-text bg-surface ${
          error ? 'border-danger' : 'border-border'
        } ${multiline ? 'min-h-24' : ''} ${className ?? ''}`}
        {...rest}
      />

      {error ? (
        <Text accessibilityLiveRegion="polite" className="text-caption text-danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
```

> **Pourquoi ces deux contournements** (vérifiés dans `node_modules`, pas supposés) :
> - `placeholderClassName` est déclaré dans `react-native-css-interop/types.d.ts` mais l'enregistrement `cssInterop(TextInput, …)` ne mappe que `className → style`. Il compilerait sans erreur et **ne ferait rien** — échec silencieux, le pire cas.
> - `accessibilityInvalid` n'existe pas dans React Native 0.85, et `AccessibilityState` n'expose que `disabled | selected | checked | busy | expanded`. RN ne supporte pas non plus `aria-invalid` (la liste `aria-*` s'arrête à `label/busy/checked/disabled/expanded/selected/value*/hidden/modal/labelledby/live`).

- [ ] **Step 4: Lancer les tests**

```bash
cd app && npm test -- input
```

Attendu : 4 tests passent.

- [ ] **Step 5: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 6: Commit**

```bash
cd app
git add src/components/ui/input.tsx src/components/ui/__tests__/input.test.tsx
git commit -m "feat: ajouter le composant Input"
```

---

## Task 7: Composants `Card` et `ListRow`

Regroupés : `ListRow` est presque toujours utilisé à l'intérieur d'une `Card`, et les deux remplacent le même pattern de bordure copié dans la liste d'animaux et la timeline d'événements.

**Files:**
- Create: `app/src/components/ui/card.tsx`
- Create: `app/src/components/ui/list-row.tsx`
- Create: `app/src/components/ui/__tests__/card.test.tsx`
- Create: `app/src/components/ui/__tests__/list-row.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 2), typo (Task 3), `Icon` (Task 4).
- Produits: `<Card elevated? children />` et `<ListRow title subtitle? leading? trailing? onPress? accessibilityLabel? />`.

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

Créer `app/src/components/ui/__tests__/card.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Card } from '@/components/ui/card';

describe('Card', () => {
  it('rend son contenu', async () => {
    await render(
      <Card>
        <Text>Carnet de santé</Text>
      </Card>,
    );

    expect(screen.getByText('Carnet de santé')).toBeTruthy();
  });
});
```

Créer `app/src/components/ui/__tests__/list-row.test.tsx` :

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

import { ListRow } from '@/components/ui/list-row';

describe('ListRow', () => {
  it('affiche le titre et le sous-titre', async () => {
    await render(<ListRow title="Rex" subtitle="Chien" />);

    expect(screen.getByText('Rex')).toBeTruthy();
    expect(screen.getByText('Chien')).toBeTruthy();
  });

  it('est un bouton accessible quand elle est pressable', async () => {
    const onPress = jest.fn();
    await render(<ListRow title="Rex" subtitle="Chien" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Rex, Chien' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('n’est pas un bouton quand elle n’est pas pressable', async () => {
    await render(<ListRow title="Rex" subtitle="Chien" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

```bash
cd app && npm test -- card list-row
```

Attendu : ÉCHEC — modules introuvables.

- [ ] **Step 3: Implémenter `Card`**

Créer `app/src/components/ui/card.tsx` :

```tsx
import type { ReactNode } from 'react';
import { View } from 'react-native';

export type CardProps = {
  children: ReactNode;
  /** Fond légèrement relevé, pour distinguer la carte du fond d'écran. */
  elevated?: boolean;
};

export function Card({ children, elevated = false }: CardProps) {
  return (
    <View
      className={`gap-3 rounded-lg border border-border p-4 ${
        elevated ? 'bg-surface-elevated' : 'bg-surface'
      }`}>
      {children}
    </View>
  );
}
```

- [ ] **Step 4: Implémenter `ListRow`**

Créer `app/src/components/ui/list-row.tsx` :

```tsx
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Par défaut : « titre, sous-titre ». */
  accessibilityLabel?: string;
};

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  onPress,
  accessibilityLabel,
}: ListRowProps) {
  const content = (
    <>
      {leading}
      <View className="flex-1">
        <Text className="text-headline font-semibold text-text">{title}</Text>
        {subtitle ? <Text className="text-callout text-text-secondary">{subtitle}</Text> : null}
      </View>
      {trailing}
    </>
  );

  const layout = 'min-h-11 flex-row items-center gap-3 rounded-md border border-border p-3';

  if (!onPress) {
    return <View className={layout}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join(', ')}
      onPress={onPress}
      className={`${layout} active:bg-surface-sunken`}>
      {content}
    </Pressable>
  );
}
```

- [ ] **Step 5: Lancer les tests**

```bash
cd app && npm test -- card list-row
```

Attendu : 4 tests passent au total.

- [ ] **Step 6: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 7: Commit**

```bash
cd app
git add src/components/ui/card.tsx src/components/ui/list-row.tsx src/components/ui/__tests__/card.test.tsx src/components/ui/__tests__/list-row.test.tsx
git commit -m "feat: ajouter les composants Card et ListRow"
```

---

## Task 8: Composants `SegmentedControl` et `Chip`

Regroupés : même famille (sélection), et tous deux corrigent le même constat d'audit (cibles tactiles sous 44pt).

**Files:**
- Create: `app/src/components/ui/segmented-control.tsx`
- Create: `app/src/components/ui/chip.tsx`
- Create: `app/src/components/ui/__tests__/segmented-control.test.tsx`
- Create: `app/src/components/ui/__tests__/chip.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 2), typo (Task 3).
- Produits:
  `<SegmentedControl options={{ value: string; label: string }[]} value onChange />`
  `<Chip label selected onPress />`

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

Créer `app/src/components/ui/__tests__/segmented-control.test.tsx` :

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

import { SegmentedControl } from '@/components/ui/segmented-control';

const OPTIONS = [
  { value: 'VACCINE', label: 'Vaccin' },
  { value: 'TREATMENT', label: 'Traitement' },
  { value: 'VISIT', label: 'Visite' },
];

describe('SegmentedControl', () => {
  it('remonte la valeur choisie', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={OPTIONS} value="VACCINE" onChange={onChange} />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Traitement' }));

    expect(onChange).toHaveBeenCalledWith('TREATMENT');
  });

  it('marque l’option courante comme sélectionnée', async () => {
    await render(<SegmentedControl options={OPTIONS} value="VACCINE" onChange={jest.fn()} />);

    expect(
      screen.getByRole('radio', { name: 'Vaccin' }).props.accessibilityState.selected,
    ).toBe(true);
    expect(
      screen.getByRole('radio', { name: 'Visite' }).props.accessibilityState.selected,
    ).toBe(false);
  });
});
```

Créer `app/src/components/ui/__tests__/chip.test.tsx` :

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

import { Chip } from '@/components/ui/chip';

describe('Chip', () => {
  it('déclenche onPress', async () => {
    const onPress = jest.fn();
    await render(<Chip label="J-15" selected={false} onPress={onPress} />);

    await fireEvent.press(screen.getByRole('checkbox', { name: 'J-15' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('expose son état sélectionné', async () => {
    await render(<Chip label="J-15" selected onPress={jest.fn()} />);

    expect(
      screen.getByRole('checkbox', { name: 'J-15' }).props.accessibilityState.checked,
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

```bash
cd app && npm test -- segmented-control chip
```

Attendu : ÉCHEC — modules introuvables.

- [ ] **Step 3: Implémenter `SegmentedControl`**

Créer `app/src/components/ui/segmented-control.tsx` :

```tsx
import { Pressable, Text, View } from 'react-native';

export type SegmentedOption = { value: string; label: string };

export type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <View accessibilityRole="radiogroup" className="flex-row gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            className={`min-h-11 flex-1 items-center justify-center rounded-md border py-2 ${
              selected ? 'border-primary bg-primary' : 'border-border'
            }`}>
            <Text
              className={`text-callout ${
                selected ? 'font-semibold text-on-primary' : 'text-text'
              }`}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Implémenter `Chip`**

Créer `app/src/components/ui/chip.tsx` :

```tsx
import { Pressable, Text } from 'react-native';

export type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-11 items-center justify-center rounded-full border px-4 ${
        selected ? 'border-primary bg-primary' : 'border-border'
      }`}>
      <Text
        className={`text-callout ${selected ? 'font-semibold text-on-primary' : 'text-text'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
```

- [ ] **Step 5: Lancer les tests**

```bash
cd app && npm test -- segmented-control chip
```

Attendu : 4 tests passent.

- [ ] **Step 6: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 7: Commit**

```bash
cd app
git add src/components/ui/segmented-control.tsx src/components/ui/chip.tsx src/components/ui/__tests__/segmented-control.test.tsx src/components/ui/__tests__/chip.test.tsx
git commit -m "feat: ajouter les composants SegmentedControl et Chip"
```

---

## Task 9: Composant `FAB`

**Files:**
- Create: `app/src/components/ui/fab.tsx`
- Create: `app/src/components/ui/__tests__/fab.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 2), `Icon`/`IconName` (Task 4).
- Produits: `<FAB icon label onPress />` — `label` est **obligatoire** (nom accessible : le FAB n'a pas de texte visible, constat d'audit #7).

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

Créer `app/src/components/ui/__tests__/fab.test.tsx` :

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

import { FAB } from '@/components/ui/fab';

describe('FAB', () => {
  it('porte un nom accessible malgré l’absence de texte visible', async () => {
    await render(<FAB icon="add" label="Ajouter un animal" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Ajouter un animal' })).toBeTruthy();
  });

  it('déclenche onPress', async () => {
    const onPress = jest.fn();
    await render(<FAB icon="add" label="Ajouter un animal" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter un animal' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

```bash
cd app && npm test -- fab
```

Attendu : ÉCHEC — module introuvable.

- [ ] **Step 3: Implémenter**

Créer `app/src/components/ui/fab.tsx` :

```tsx
import { Pressable } from 'react-native';

import { Icon, type IconName } from './icon';

export type FABProps = {
  icon: IconName;
  /** Nom lu par les lecteurs d'écran — obligatoire, le FAB n'a pas de texte. */
  label: string;
  onPress: () => void;
};

export function FAB({ icon, label, onPress }: FABProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      // Élévation Material 3 : ombre portée + surface primaire.
      style={{
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
      className="h-14 w-14 items-center justify-center rounded-full bg-primary active:bg-primary-pressed">
      <Icon name={icon} size={26} decorative />
    </Pressable>
  );
}
```

- [ ] **Step 4: Lancer les tests**

```bash
cd app && npm test -- fab
```

Attendu : 2 tests passent.

- [ ] **Step 5: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 6: Commit**

```bash
cd app
git add src/components/ui/fab.tsx src/components/ui/__tests__/fab.test.tsx
git commit -m "feat: ajouter le composant FAB"
```

---

## Task 10: Composants `EmptyState`, `ErrorState` et `Skeleton`

Regroupés : les trois états d'une même vue (vide / en erreur / en chargement). Les livrer ensemble garantit qu'ils sont cohérents. `ErrorState` corrige le cul-de-sac sans retry (constat d'audit #5).

**Files:**
- Create: `app/src/components/ui/empty-state.tsx`
- Create: `app/src/components/ui/error-state.tsx`
- Create: `app/src/components/ui/skeleton.tsx`
- Create: `app/src/components/ui/__tests__/states.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 2), typo (Task 3), `Icon`/`IconName` (Task 4), `Button` (Task 5).
- Produits:
  `<EmptyState icon title message? actionLabel? onAction? />`
  `<ErrorState message onRetry? />`
  `<Skeleton variant?: 'row' | 'card' | 'circle' count?: number />`

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

Créer `app/src/components/ui/__tests__/states.test.tsx` :

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

describe('EmptyState', () => {
  it('affiche le titre et le message', async () => {
    await render(<EmptyState icon="paw" title="Aucun animal" message="Ajoutez votre premier compagnon." />);

    expect(screen.getByText('Aucun animal')).toBeTruthy();
    expect(screen.getByText('Ajoutez votre premier compagnon.')).toBeTruthy();
  });

  it('déclenche l’action quand elle est fournie', async () => {
    const onAction = jest.fn();
    await render(
      <EmptyState icon="paw" title="Aucun animal" actionLabel="Ajouter" onAction={onAction} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter' }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('n’affiche pas de bouton sans action', async () => {
    await render(<EmptyState icon="paw" title="Aucun animal" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('n’affiche pas de bouton mort quand une seule des deux props est fournie', async () => {
    // Cas mixte : sans lui, une condition affaiblie (`actionLabel ?` au lieu de
    // `actionLabel && onAction ?`) rendrait un bouton sans handler sans être détectée.
    await render(<EmptyState icon="paw" title="Aucun animal" actionLabel="Ajouter" />);
    expect(screen.queryByRole('button')).toBeNull();

    // `await` obligatoire : sans lui, des appels act() se chevauchent et
    // corrompent le singleton `screen` de RNTL pour les tests suivants.
    await screen.unmount();

    await render(<EmptyState icon="paw" title="Aucun animal" onAction={jest.fn()} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('ErrorState', () => {
  it('affiche le message et permet de réessayer', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState message="Chargement impossible" onRetry={onRetry} />);

    expect(screen.getByText('Chargement impossible')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Réessayer' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('n’affiche pas de bouton quand aucun retry n’est possible', async () => {
    await render(<ErrorState message="Chargement impossible" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Skeleton', () => {
  it('se déclare occupé aux lecteurs d’écran', async () => {
    await render(<Skeleton />);

    // Asserter l'état `busy` lui-même : trouver le nœud par son label ne prouve
    // pas qu'il s'annonce comme occupé.
    const node = screen.getByLabelText('Chargement en cours');
    expect(node.props.accessibilityState).toMatchObject({ busy: true });
  });

  it('rend le nombre de placeholders demandé', async () => {
    await render(<Skeleton count={3} testID="skeleton" />);

    expect(screen.getAllByTestId('skeleton-item')).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

```bash
cd app && npm test -- states
```

Attendu : ÉCHEC — modules introuvables.

- [ ] **Step 3: Implémenter `EmptyState`**

Créer `app/src/components/ui/empty-state.tsx` :

```tsx
import { Text, View } from 'react-native';

import { Button } from './button';
import { Icon, type IconName } from './icon';

export type EmptyStateProps = {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-3 px-8 py-16">
      <Icon name={icon} size={40} decorative />
      <Text className="text-headline font-semibold text-text text-center">{title}</Text>
      {message ? (
        <Text className="text-callout text-text-secondary text-center">{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View className="mt-2">
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 4: Implémenter `ErrorState`**

Créer `app/src/components/ui/error-state.tsx` :

```tsx
import { Text, View } from 'react-native';

import { Button } from './button';
import { Icon } from './icon';

export type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View className="items-center justify-center gap-3 px-8 py-16">
      <Icon name="alert" size={40} decorative />
      <Text className="text-callout text-text-secondary text-center">{message}</Text>
      {onRetry ? (
        <View className="mt-2">
          <Button label="Réessayer" variant="secondary" icon="refresh" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
```

- [ ] **Step 5: Implémenter `Skeleton`**

Créer `app/src/components/ui/skeleton.tsx` :

```tsx
import { View } from 'react-native';

export type SkeletonProps = {
  variant?: 'row' | 'card' | 'circle';
  count?: number;
  testID?: string;
};

const SHAPE: Record<NonNullable<SkeletonProps['variant']>, string> = {
  row: 'h-16 rounded-md',
  card: 'h-32 rounded-lg',
  circle: 'h-14 w-14 rounded-full',
};

export function Skeleton({ variant = 'row', count = 1, testID }: SkeletonProps) {
  return (
    <View
      accessible
      accessibilityLabel="Chargement en cours"
      accessibilityState={{ busy: true }}
      className="gap-3">
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          testID={testID ? `${testID}-item` : undefined}
          className={`bg-surface-sunken ${SHAPE[variant]}`}
        />
      ))}
    </View>
  );
}
```

- [ ] **Step 6: Lancer les tests**

```bash
cd app && npm test -- states
```

Attendu : 7 tests passent.

- [ ] **Step 7: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 8: Commit**

```bash
cd app
git add src/components/ui/empty-state.tsx src/components/ui/error-state.tsx src/components/ui/skeleton.tsx src/components/ui/__tests__/states.test.tsx
git commit -m "feat: ajouter les états vide, erreur et chargement"
```

---

## Task 11: `Toast` et son provider

Corrige le constat d'audit #5 : aucune confirmation visuelle après une sauvegarde. Le provider est monté une fois à la racine ; les écrans appellent `useToast().show(...)`.

**Files:**
- Create: `app/src/components/ui/toast.tsx`
- Create: `app/src/components/ui/__tests__/toast.test.tsx`

**Interfaces:**
- Consumes: tokens (Task 2), typo (Task 3), `Icon` (Task 4).
- Produits: `<ToastProvider>{children}</ToastProvider>` et le hook `useToast(): { show(message: string, type?: 'success' | 'error'): void }`. Le Lot 3 montera `ToastProvider` dans `src/app/_layout.tsx`.

- [ ] **Step 1: Écrire les tests (ils doivent échouer)**

Créer `app/src/components/ui/__tests__/toast.test.tsx` :

```tsx
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { AccessibilityInfo, Button as RNButton } from 'react-native';

import { ToastProvider, useToast } from '@/components/ui/toast';

function Probe() {
  const { show } = useToast();
  return <RNButton title="déclencher" onPress={() => show('Réglages enregistrés')} />;
}

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('n’affiche rien tant qu’aucun toast n’est demandé', async () => {
    await render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    expect(screen.queryByText('Réglages enregistrés')).toBeNull();
  });

  it('affiche le message demandé', async () => {
    await render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('déclencher'));

    expect(screen.getByText('Réglages enregistrés')).toBeTruthy();
  });

  it('disparaît après 3 secondes', async () => {
    await render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('déclencher'));
    // act asynchrone : forme vérifiée empiriquement avec RNTL 14 + fake timers.
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Réglages enregistrés')).toBeNull();
  });

  it('réarme le délai quand un second toast remplace le premier', async () => {
    await render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('déclencher'));
    // 2 s plus tard, on déclenche un second toast : il doit vivre 3 s pleines,
    // et non être coupé au bout d'1 s par le timer du premier.
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await fireEvent.press(screen.getByText('déclencher'));
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Réglages enregistrés')).toBeTruthy();
  });

  it('annonce le message aux lecteurs d’écran (iOS et Android)', async () => {
    // Mécanisme d'annonce unique : `accessibilityLiveRegion` est Android-only et
    // ferait double emploi avec cet appel.
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('déclencher'));

    expect(announce).toHaveBeenCalledWith('Réglages enregistrés');
    announce.mockRestore();
  });

  it('lève une erreur si useToast est utilisé hors provider', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // `render` étant asynchrone, l'erreur remonte en rejet de promesse,
    // pas en throw synchrone.
    await expect(render(<Probe />)).rejects.toThrow(/ToastProvider/);

    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

```bash
cd app && npm test -- toast
```

Attendu : ÉCHEC — module introuvable.

- [ ] **Step 3: Implémenter**

Créer `app/src/components/ui/toast.tsx` :

```tsx
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';

import { Icon } from './icon';

const DISMISS_AFTER_MS = 3000;

type ToastType = 'success' | 'error';
type ToastState = { message: string; type: ToastType } | null;

type ToastApi = { show: (message: string, type?: ToastType) => void };

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast doit être utilisé dans un ToastProvider');
  return api;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, type });
    // Mécanisme d'annonce unique, valable iOS ET Android. On n'utilise PAS
    // `accessibilityLiveRegion` en plus : il est annoté `@platform android`, donc
    // il ne couvrirait pas iOS, et cumulé à cet appel il ferait annoncer le
    // message deux fois par TalkBack.
    AccessibilityInfo.announceForAccessibility(message);
    timer.current = setTimeout(() => setToast(null), DISMISS_AFTER_MS);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <View
          accessibilityRole="alert"
          className="absolute bottom-24 left-4 right-4 flex-row items-center gap-2 rounded-md border border-border bg-surface-elevated px-4 py-3">
          <Icon name={toast.type === 'success' ? 'check' : 'alert'} size={20} decorative />
          <Text className="flex-1 text-callout text-text">{toast.message}</Text>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 4: Lancer les tests**

```bash
cd app && npm test -- toast
```

Attendu : 4 tests passent.

- [ ] **Step 5: Vérifier**

```bash
cd app && npx tsc --noEmit && npm run lint
```

- [ ] **Step 6: Commit**

```bash
cd app
git add src/components/ui/toast.tsx src/components/ui/__tests__/toast.test.tsx
git commit -m "feat: ajouter le toast et son provider"
```

---

## Task 12: Barrel export et vérification d'ensemble

Dernière tâche : un point d'entrée unique pour la librairie, et la preuve que l'ensemble tient debout dans l'app réelle (pas seulement sous jest).

**Files:**
- Create: `app/src/components/ui/index.ts`
- Create: `app/src/components/ui/__tests__/index.test.tsx`

**Interfaces:**
- Consumes: tous les composants des Tasks 4 à 11.
- Produits: `import { Button, Input, Card, ... } from '@/components/ui'` — la forme d'import qu'utilisera tout le Lot 3.

- [ ] **Step 1: Écrire le test (il doit échouer)**

Créer `app/src/components/ui/__tests__/index.test.tsx` :

```tsx
import * as UI from '@/components/ui';

describe('barrel export de la librairie UI', () => {
  it('expose tous les composants du Lot 2', async () => {
    const expected = [
      'Button',
      'Card',
      'Chip',
      'EmptyState',
      'ErrorState',
      'FAB',
      'Icon',
      'Input',
      'ListRow',
      'SegmentedControl',
      'Skeleton',
      'ToastProvider',
      'useToast',
    ];

    for (const name of expected) {
      expect(UI).toHaveProperty(name);
    }
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier l'échec**

```bash
cd app && npm test -- index
```

Attendu : ÉCHEC — module introuvable.

- [ ] **Step 3: Implémenter le barrel**

Créer `app/src/components/ui/index.ts` :

```ts
export { Button, type ButtonProps, type ButtonVariant } from './button';
export { Card, type CardProps } from './card';
export { Chip, type ChipProps } from './chip';
export { EmptyState, type EmptyStateProps } from './empty-state';
export { ErrorState, type ErrorStateProps } from './error-state';
export { FAB, type FABProps } from './fab';
export { Icon, type IconName, type IconProps } from './icon';
export { Input, type InputProps } from './input';
export { ListRow, type ListRowProps } from './list-row';
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from './segmented-control';
export { Skeleton, type SkeletonProps } from './skeleton';
export { ToastProvider, useToast } from './toast';
```

- [ ] **Step 4: Lancer la suite complète**

```bash
cd app && npm test
```

Attendu : **tous les tests passent** (harnais, tokens, typo, et les 9 composants).

- [ ] **Step 5: Vérifier types et lint sur tout le projet**

```bash
cd app && npx tsc --noEmit && npm run lint
```

Attendu : aucune erreur.

- [ ] **Step 6: Vérifier dans l'app réelle**

Les tests jest ne prouvent pas que NativeWind résout les classes à l'exécution. Vérification finale obligatoire :

```bash
cd app && npx expo start --clear
```

Puis charger l'app dans le simulateur iOS et confirmer :
1. L'app démarre **sans erreur de bundling** (un token ou une classe invalide casse Metro).
2. Les écrans existants s'affichent normalement — ce plan ne les a pas modifiés, aucune régression visuelle n'est attendue.

- [ ] **Step 7: Commit**

```bash
cd app
git add src/components/ui/index.ts src/components/ui/__tests__/index.test.tsx
git commit -m "feat: ajouter le barrel export de la librairie de composants"
```

---

## Self-Review

**1. Couverture du spec (design doc §2 et §3) :**

| Exigence spec | Tâche |
|---|---|
| §2.1 Tokens sémantiques light/dark | Task 2 |
| §2.2 Palette Direction A (Teal) | Task 2 (choix tranché et figé) |
| §2.3 Échelle typographique | Task 3 |
| §2.4 Radius + cibles 44pt | Task 2 (radius) + intégré à chaque composant (`min-h-11`) |
| §3 Button / Input / Card / ListRow | Tasks 5, 6, 7 |
| §3 SegmentedControl / Chip / FAB | Tasks 8, 9 |
| §3 Icon (wrapper) | Task 4 |
| §3 EmptyState / ErrorState / Skeleton | Task 10 |
| §3 Toast | Task 11 |
| §3 A11y portée par les composants | Intégrée aux Tasks 4-11, testée dans chacune |

Hors périmètre de ce plan (plans ultérieurs) : §4 migration des écrans (Lot 3), §5 formulaires/date pickers (Lot 4), §6 icônes-dans-les-écrans + états-dans-les-écrans + pull-to-refresh (Lot 5), §7 haptics/animations (Lot 6).

**2. Placeholders :** aucun « TBD » / « à compléter » / « similaire à Task N ». Chaque étape de code contient le code complet.

**3. Cohérence des types :** `IconName` (Task 4) est consommé par `Button.icon`, `FAB.icon`, `EmptyState.icon` — même nom, même source. `ButtonVariant` défini Task 5, réutilisé par `ErrorState` (`variant="secondary"`). `useToast` retourne `{ show }`, utilisé tel quel dans le test de Task 11 et le barrel de Task 12. Les noms de tokens du §2.1 du spec correspondent exactement aux variables CSS de Task 2 et aux classes citées dans les Tasks 5-11.

**4. Vérification des API dans `node_modules` (faite, pas supposée) :**

Deux props utilisées dans une première version de la Task 6 ont été vérifiées puis **supprimées car inexistantes** :

| Prop | Verdict | Solution retenue |
|---|---|---|
| `placeholderClassName` | Typée dans `react-native-css-interop/types.d.ts` mais **non implémentée** — `cssInterop(TextInput, …)` ne mappe que `className → style`. Aurait compilé sans erreur et n'aurait rien fait. | `placeholderTextColor={colors.textTertiary}` via `useColorScheme()` + `Colors` (d'où l'ajout de `textTertiary` en Task 2) |
| `accessibilityInvalid` | **N'existe pas** en RN 0.85. `AccessibilityState` = `disabled \| selected \| checked \| busy \| expanded` uniquement. Pas d'`aria-invalid` non plus. | Erreur jointe au nom accessible : `accessibilityLabel={\`${label}, erreur : ${error}\`}` + `accessibilityLiveRegion="polite"` sur le texte d'erreur |

Les autres props d'accessibilité employées dans le plan sont, elles, confirmées dans RN 0.85 : `accessibilityRole`, `accessibilityLabel`, `accessibilityState` (`disabled`/`busy`/`selected`/`checked`), `accessibilityLiveRegion`, `accessibilityElementsHidden`, `importantForAccessibility`.

---

## Corrections post-review finale

La review finale de branche a trouvé un défaut que les reviews par tâche ne pouvaient pas voir — il n'existait qu'à la couture entre `Icon` et ses cinq consommateurs. Les corrections suivantes ont été appliquées après la Task 12.

| Sévérité | Défaut | Correction |
|---|---|---|
| **Critical** | `Icon` laissait passer `color: undefined`, et `@expo/vector-icons` substitue `DEFAULT_ICON_COLOR = 'black'`. La couleur d'un `Text` RN n'hérite pas d'un `View` parent, donc la classe du parent n'atteignait jamais le glyphe. **En dark mode, les icônes d'`EmptyState`/`ErrorState`/`Toast` étaient noires sur fond quasi-noir — invisibles** ; sur `Button` primary et `FAB`, noires sur teal. | Couleur par défaut résolue selon le thème (`useColorScheme()` + `Colors`, comme `Input`), et couleur explicite aux 5 call sites. Vérifié visuellement en simulateur, light et dark. |
| Important | Le toast était positionné en absolu sur toute la largeur sans `pointerEvents` : il interceptait tous les taps pendant ses 3 s d'affichage. | `pointerEvents="none"` sur la vue du toast. |
| Important | Seul `Input` acceptait `className` ; `FAB` consommait `style` en interne, donc **un écran ne pouvait pas le positionner** — alors que l'écran des animaux positionne son bouton flottant en absolu. | `className?` et `testID?` ajoutés à `Button`, `Card`, `ListRow`, `FAB` (className fusionné en dernier). |
| Important | Les hex de `constants/theme.ts` et les variables CSS de `global.css` étaient dupliqués, leur synchronisation garantie par un simple commentaire — et `Input`/`Icon` en dépendent à l'exécution. | Test qui parse `global.css` et compare les clés communes aux deux systèmes. |

### Lacunes connues pour le Lot 3 (migration des écrans)

Non bloquantes ici, mais à traiter au moment de la migration :

- **Pas de composant `Avatar`** (photo d'animal + repli patte) — la liste des animaux le réimplémenterait par écran.
- **`Card` n'est pas pressable** — une carte cliquable devra être enveloppée dans un `Pressable`, perdant la convention de feedback `active:`.
- **Pas de `Badge`** pour le type d'événement (vaccin / traitement / visite).
- **`SegmentedControl.value` est `string`**, non générique : l'union `VACCINE|TREATMENT|VISIT` est perdue à la frontière.
- **`Toast.type` ne change que l'icône**, pas la couleur, alors que les tokens `success` et `danger` existent.
