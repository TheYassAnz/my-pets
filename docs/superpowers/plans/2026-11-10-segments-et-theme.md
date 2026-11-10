# Segments rognés + choix du thème — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger le segment actif rogné du formulaire « Nouvelle entrée » et laisser l'utilisateur choisir son thème (Système / Clair / Sombre).

**Architecture:** Le segment est corrigé par des rayons concentriques (rayon intérieur = rayon extérieur − padding). Le thème sombre existe déjà mais ne suit que `prefers-color-scheme` : on remplace la media query CSS par un attribut `data-theme` sur `<html>`, posé par un petit store (`src/lib/color-scheme.ts`, préférence en `localStorage`) et par un script inline dans `index.html` (pas de flash au chargement). Tous les composants qui lisent le thème en JS passent par `@/hooks/use-color-scheme`, branché sur ce store.

**Tech Stack:** Expo 56 web (react-native-web 0.21), NativeWind 4 + Tailwind 3 (couleurs = variables CSS `--color-*`), Jest (`jest-expo`, `@testing-library/react-native`).

**Spec:** pas de document séparé — la demande de Yassine du 2026-11-10 (capture du segment « Vaccin » rogné + « ajouter un mode clair/sombre ») et ses réponses :
- Thème : sélecteur à 3 choix **Système / Clair / Sombre**, « Système » par défaut.
- Emplacement : **écran d'accueil** (`(app)/index.tsx`), aucun nouvel écran.
- Persistance : **sur l'appareil** (`localStorage`), aucun changement d'API ni migration.
- Segments : **garder la forme pilule**, angles concentriques.

## Global Constraints

- Front web uniquement : aucun changement dans `api/`, aucune migration Prisma.
- Clé de stockage : `mypets.theme` ; valeurs `'system' | 'light' | 'dark'` ; toute autre valeur (ou stockage inaccessible) = `'system'`.
- Libellés UI exacts : titre de section `Apparence`, options `Système`, `Clair`, `Sombre`.
- Les palettes ne changent pas : `Colors` (`src/constants/theme.ts`) et `global.css` restent synchronisés (test `tokens.test.tsx`).
- Plus aucun `useColorScheme` importé de `react-native` dans `src/` hors `src/lib/color-scheme.ts`.
- Commits en français, préfixe conventionnel (`fix(app):`, `feat(app):`), sur une branche dédiée depuis `main`.

## Review Focus

1. **Flash au chargement** : préférence « Sombre » + système clair → la page ne doit jamais s'afficher en blanc avant de passer en noir (script inline, Task 3).
2. **`localStorage` bloqué** (Safari privé, cookies bloqués) → l'app démarre en « Système », aucun plantage ; le choix marche le temps de la session (Task 2, tests).
3. **Changement du thème système app ouverte** : en « Système » l'app suit en direct ; en « Clair »/« Sombre » forcé elle l'ignore (Task 2, test du hook).
4. **Couleurs calculées en JS** (icônes, placeholder des champs, `ActivityIndicator`, illustrations, en-tête de navigation) suivent le thème forcé et pas celui du système (Task 3, grep + vérif navigateur).
5. **Contrôles natifs du navigateur** (champ date web, barres de défilement) et barre d'état PWA (`theme-color`) cohérents avec le thème forcé (Task 2 `color-scheme` + meta, vérif navigateur Task 4).

---

### Task 1: Segment actif non rogné

Diagnostic : le conteneur est `rounded-xl` (24 px) avec `p-[3px]`, la pastille active `rounded-[10px]`. Ses coins à 10 px dépassent la courbe à 24 px du fond gris et se fondent dans le fond blanc de la page : le bord gauche du 1er segment (et droit du dernier) paraît coupé. Même défaut en sombre (pastille noire sur page noire). Utilisé par `entry-form.tsx` et `health-event-form.tsx`, corrigé une fois dans le composant.

**Files:**
- Modify: `app/src/components/ui/segmented-control.tsx` (classe du `Pressable`)

**Interfaces:**
- Produces: `SegmentedControl` inchangé côté props (réutilisé en Task 4).

- [ ] **Step 1: Remplacer `rounded-[10px]` par `rounded-[21px]` sur le `Pressable`** (24 − 3 = 21), avec un commentaire d'une ligne : `// rayon = rayon du conteneur (24) − padding (3) : angles concentriques`.
- [ ] **Step 2: Tests existants**

Run: `cd app && npx jest src/components/ui/__tests__/segmented-control.test.tsx`
Expected: 3 tests PASS.

- [ ] **Step 3: Vérif visuelle** — `preview_start` sur le dev server web (`npm run web`, port 8081, API locale `npm run start:dev` dans `api/`), se connecter avec un compte de test existant (l'API locale pointe sur la vraie base Supabase : ne pas créer de compte sans l'accord de Yassine ; à défaut, vérifier sur la preview Vercel de la branche), ouvrir `/animals/<id>/events/new` : segment « Vaccin » puis « Poids » sélectionnés, bords arrondis entiers des deux côtés, à 375 px et à 1280 px de large. Capture d'écran à l'appui.
- [ ] **Step 4: Commit** — `fix(app): segment actif rogné (rayons concentriques)`

---

### Task 2: Store de préférence de thème

**Files:**
- Create: `app/src/lib/color-scheme.ts`
- Test: `app/src/lib/__tests__/color-scheme.test.ts`

**Interfaces:**
- Produces (utilisés par Tasks 3 et 4) :
  - `export type ThemePreference = 'system' | 'light' | 'dark'`
  - `export const THEME_STORAGE_KEY = 'mypets.theme'`
  - `export function resolveColorScheme(pref: ThemePreference, systemDark: boolean): 'light' | 'dark'`
  - `export function getThemePreference(): ThemePreference`
  - `export function setThemePreference(pref: ThemePreference): void`
  - `export function useThemePreference(): ThemePreference`
  - `export function useResolvedColorScheme(): 'light' | 'dark'`

- [ ] **Step 1: Écrire les tests qui échouent** — même façon de simuler `global.localStorage` que `src/lib/__tests__/auth-context.test.tsx` ; `global.matchMedia = jest.fn(() => ({ matches, addEventListener, removeEventListener }))` avec un `matches` pilotable et l'écouteur `change` capturé. Réinitialiser le module entre tests (`jest.isolateModules` ou `jest.resetModules`) car le store a un état.
  - `resolveColorScheme` : `('system', true) → 'dark'`, `('system', false) → 'light'`, `('light', true) → 'light'`, `('dark', false) → 'dark'`.
  - `getThemePreference()` → `'system'` si rien de stocké, si `'violet'` est stocké, et si `localStorage.getItem` lève.
  - `setThemePreference('dark')` → `localStorage.getItem('mypets.theme') === 'dark'` et `getThemePreference() === 'dark'` ; ne lève pas si `setItem` lève (et `getThemePreference()` renvoie quand même `'dark'` ensuite).
  - `renderHook(useResolvedColorScheme)` avec système clair → `'light'` ; `act(() => setThemePreference('dark'))` → `'dark'`.
  - Préférence `'system'`, système clair → `'light'` ; déclencher l'écouteur `change` avec `matches = true` → `'dark'`. Même scénario avec préférence `'light'` → reste `'light'`.
- [ ] **Step 2: Lancer** — `cd app && npx jest src/lib/__tests__/color-scheme.test.ts` → FAIL (module introuvable).
- [ ] **Step 3: Implémenter `src/lib/color-scheme.ts`**
  - Préférence en mémoire, initialisée depuis `localStorage` (try/catch) ; lectures/écritures toujours protégées.
  - Abonnés notifiés à chaque `setThemePreference` et à chaque `change` de `matchMedia('(prefers-color-scheme: dark)')` (écouteur posé une fois, protégé si `matchMedia` absent → système clair).
  - Les deux hooks via `useSyncExternalStore`.
  - À chaque changement du thème résolu, si `document` existe : `documentElement.dataset.theme = resolved`, `documentElement.style.colorScheme = resolved`, et `content` de `meta[name="theme-color"]` = `Colors[resolved].surface`.
- [ ] **Step 4: Lancer** — même commande → PASS.
- [ ] **Step 5: Commit** — `feat(app): store de préférence de thème (système/clair/sombre)`

---

### Task 3: Brancher le thème sur le CSS et les composants

**Files:**
- Modify: `app/src/global.css` (bloc sombre)
- Modify: `app/src/components/ui/__tests__/tokens.test.tsx` (marqueur du bloc sombre)
- Modify: `app/public/index.html` (script inline dans `<head>`)
- Modify: `app/src/hooks/use-color-scheme.ts` ; Delete: `app/src/hooks/use-color-scheme.web.ts`
- Modify (import seulement) : `app/src/app/_layout.tsx`, `app/src/components/auth-portraits.tsx`, `app/src/components/ui/{avatar,button,date-field,empty-state,error-state,icon,input,type-icon}.tsx`

**Interfaces:**
- Consumes: `useResolvedColorScheme`, `THEME_STORAGE_KEY` (Task 2).
- Produces: `useColorScheme(): 'light' | 'dark'` exporté par `@/hooks/use-color-scheme`.

- [ ] **Step 1: Test d'abord** — dans `tokens.test.tsx`, remplacer `DARK_MEDIA_MARKER = '@media (prefers-color-scheme: dark)'` par `":root[data-theme='dark']"` (renommer la constante en `DARK_MARKER`). Run `npx jest src/components/ui/__tests__/tokens.test.tsx` → FAIL (« Bloc … introuvable »).
- [ ] **Step 2: `global.css`** — remplacer `@media (prefers-color-scheme: dark) { :root { … } }` par `:root[data-theme='dark'] { … }` (mêmes variables, dans `@layer base`). Relancer → PASS.
- [ ] **Step 3: Script anti-flash dans `index.html`** — tout en haut de `<head>`, un `<script>` inline : lit `localStorage['mypets.theme']` (try/catch), résout avec `matchMedia('(prefers-color-scheme: dark)')` comme `resolveColorScheme`, pose `data-theme` et `style.colorScheme` sur `document.documentElement`. Commentaire : la clé doit rester égale à `THEME_STORAGE_KEY`.
- [ ] **Step 4: Hook unique** — `use-color-scheme.ts` devient `export { useResolvedColorScheme as useColorScheme } from '@/lib/color-scheme';` ; supprimer `use-color-scheme.web.ts` (garde d'hydratation inutile : `web.output` vaut `single`). `use-theme.ts` : retirer la branche `'unspecified'` devenue impossible.
- [ ] **Step 5: Remplacer l'import** `useColorScheme` de `react-native` par `@/hooks/use-color-scheme` dans les 10 fichiers listés (le reste de l'import `react-native` est conservé).

Run: `cd app && grep -rn "useColorScheme" src | grep "from 'react-native'\|from \"react-native\""`
Expected: aucune ligne.

- [ ] **Step 6: Suite complète** — `cd app && npm test && npm run lint && npx tsc --noEmit` → tout vert.
- [ ] **Step 7: Commit** — `feat(app): thème piloté par data-theme au lieu de prefers-color-scheme`

---

### Task 4: Sélecteur « Apparence » sur l'accueil

**Files:**
- Modify: `app/src/app/(app)/index.tsx`

**Interfaces:**
- Consumes: `SegmentedControl` (Task 1), `useThemePreference`, `setThemePreference`, `ThemePreference` (Task 2).

- [ ] **Step 1: Ajouter la section** après `{body}` dans le `ScrollView` : libellé `Apparence` (`text-[13px] text-text-secondary`, `mt-10 mb-2`) puis `<SegmentedControl options={THEME_OPTIONS} value={pref} onChange={(v) => setThemePreference(v as ThemePreference)} />`, avec `THEME_OPTIONS = [{ value: 'system', label: 'Système' }, { value: 'light', label: 'Clair' }, { value: 'dark', label: 'Sombre' }]` en constante de module. Visible aussi en état chargement/erreur/vide.
- [ ] **Step 2: Vérif navigateur** (dev server comme Task 1), système en clair (`resize_window colorScheme: light`) :
  - « Sombre » → fond noir, textes blancs, icônes et placeholders clairs, segment actif bien arrondi ; `document.documentElement.dataset.theme === 'dark'`.
  - Recharger → reste sombre **sans flash blanc** ; `localStorage['mypets.theme'] === 'dark'`.
  - « Système » puis `colorScheme: dark` → passe en sombre sans recharger ; « Clair » puis `colorScheme: dark` → reste clair.
  - Formulaire « Nouvelle entrée » en sombre : champ date lisible, segments corrects.
  - `read_console_messages` sans erreur. Captures clair + sombre.
- [ ] **Step 3: Build** — `cd app && npm run build:web` → succès, `dist/index.html` contient le script inline.
- [ ] **Step 4: Commit** — `feat(app): choix du thème Système/Clair/Sombre sur l'accueil`
