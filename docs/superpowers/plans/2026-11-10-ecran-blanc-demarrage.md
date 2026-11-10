# Écran blanc au démarrage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** L'app ne reste plus blanche à l'ouverture : un splash s'affiche dès le HTML, un message apparaît si l'attente dure, et un échec de connexion à l'API affiche une erreur avec « Réessayer » au lieu d'un écran vide ou d'une déconnexion à tort.

**Architecture:** Le blanc a trois causes dans le code actuel : (1) `#root` est vide dans `app/public/index.html` tant que le bundle JS n'est pas chargé ; (2) `_layout.tsx` fait `return null` pendant le chargement des polices (et pour toujours si le chargement échoue) puis pendant la restauration de session ; (3) cette restauration (`refreshSession` puis `/auth/me`) n'a aucun délai maximum et traite toute erreur réseau comme « pas de session ». On ajoute un splash HTML/CSS inline (hors `#root`, donc jamais effacé par React) que le JS retire quand l'app est prête, on distingue « refusé » de « injoignable » dans le client API, et on affiche `ErrorState` en cas d'injoignable.

**Tech Stack:** Expo 56 web (react-native-web), Expo Router, NativeWind, Jest (`jest-expo`, `@testing-library/react-native`).

**Spec:** pas de document séparé — la demande de Yassine du 2026-11-10 (« l'application ne reste pas figée en blanc lors de l'ouverture ») et ses réponses :
- Quand : **à chaque ouverture** (pas seulement après inactivité) → on traite tous les blancs, pas seulement le réveil de Render.
- Affichage : **splash fixe dès le HTML, puis message si l'attente est longue**.
- Réveil de Render (~1 min) : **gestion côté front uniquement** (pas de ping keep-alive, pas de plan payant).
- Session : **on attend la restauration** avant d'afficher l'app (pas d'affichage optimiste).
- Splash : **icône de l'app sur fond uni clair/sombre**.
- Échec réseau/timeout : **écran d'erreur + « Réessayer »**, jamais de bascule silencieuse vers sign-in.

## Global Constraints

- Front web uniquement : aucun changement dans `api/`, aucune migration Prisma, aucun changement du service worker (`public/sw.js`).
- Identifiants exacts : élément `#splash`, message `#splash-msg`, classe de sortie `splash-hide`.
- Message d'attente (affiché après 6 000 ms si le splash est encore là) : `Un instant… le serveur se réveille, cela peut prendre jusqu'à une minute.`
- Fondu de sortie : 200 ms ; l'élément est retiré du DOM à 250 ms.
- Délai max d'un refresh : `REFRESH_TIMEOUT_MS = 90_000` (hypothèse : réveil Render ≈ 60 s).
- Couleurs du splash (alignées sur `global.css`) : clair fond `#FFFFFF` / texte `#8A8A8E` ; sombre fond `#000000` / texte `#8E8E93`. Le sombre s'applique si `prefers-color-scheme: dark` **ou** `:root[data-theme="dark"]` ; jamais si `:root[data-theme="light"]` (compatibilité avec `2026-11-10-segments-et-theme.md`, qui pose `data-theme` sur `<html>`).
- Libellé de l'erreur : `Impossible de joindre le serveur. Réessayez dans un instant.`
- Icône du splash : `/icons/icon-192.png`, 96×96 px. Depuis le 2026-11-10 c'est le logo « Patte » (patte noire `#0A0A0A` sur fond blanc, source `app/assets/images/logo-patte.svg`), choisi par Yassine. L'icône est opaque sur fond blanc : en mode sombre le splash noir affiche donc une tuile blanche de 96 px : `#splash img` reçoit `border-radius: 22px` pour qu'elle ressemble à une icône d'app (assumé tant qu'aucune variante sombre n'existe).
- Commits en français, préfixe conventionnel (`fix(app):`), sur une branche dédiée `fix/ecran-blanc-demarrage` créée depuis `main`. Ne jamais `git add -A` (des modifications `api/` non liées sont en cours dans l'arbre).
- Commandes depuis `app/`. Après les modifications de code, lancer `graphify update .` (règle de `app/AGENTS.md`).

## Review Focus

1. **Cookie valide + API en train de se réveiller** (réponse 502/503/504 ou timeout) → l'utilisateur n'est **pas** déconnecté : écran d'erreur + « Réessayer » (Tasks 1 et 2, tests).
2. **Police Nunito qui ne charge pas** (réseau coupé, requête bloquée) → l'app s'affiche avec la police système, pas de blanc permanent (Task 3, vérif Task 4).
3. **Mode sombre** → splash noir dès le premier pixel, aucun flash blanc (Task 3, vérif Task 4).
4. **« Réessayer »** → pendant la nouvelle tentative on voit un indicateur de chargement, jamais un écran vide (Task 3).
5. **`/auth/me` qui échoue en 5xx après un refresh réussi** → erreur « injoignable », pas déconnexion ; seul un 401 renvoie vers sign-in (Task 2, test).

---

### Task 1: Le client API distingue « refusé » de « injoignable » et plafonne l'attente

**Files:**
- Modify: `app/src/lib/api.ts:38-67` (`refreshSession`)
- Test: `app/src/lib/__tests__/api-session.test.ts`

**Interfaces:**
- Produces:
  - `export type RefreshOutcome = 'ok' | 'denied' | 'unreachable'`
  - `export const REFRESH_TIMEOUT_MS = 90_000`
  - `export function refreshOutcome(): Promise<RefreshOutcome>` — même vol unique (promesse partagée + Web Locks) que l'actuel `refreshSession`.
  - `export function refreshSession(): Promise<boolean>` — inchangée pour ses appelants (`send()`), devient `(await refreshOutcome()) === 'ok'`.

- [ ] **Step 1: Write the failing tests** — dans le `describe('session par cookie')` de `api-session.test.ts`, mêmes helpers `json`/`fetchMock` :
  - `refreshOutcome renvoie 'ok' et mémorise le token sur 200` : fetch → `json(200, { accessToken: 'new' })` ; `expect(await mod.refreshOutcome()).toBe('ok')` ; `expect(mod.getAccessToken()).toBe('new')`.
  - `refreshOutcome renvoie 'denied' sur 401` : `json(401, {})` → `'denied'`, token `null`.
  - `refreshOutcome renvoie 'unreachable' sur 503` et `sur 502` : → `'unreachable'`, token `null`.
  - `refreshOutcome renvoie 'unreachable' quand fetch rejette` : `fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))` → `'unreachable'`.
  - `le refresh est plafonné par un signal d'abandon` : après un appel, `(fetchMock.mock.calls[0][1] as RequestInit).signal` est `instanceof AbortSignal`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd app && npx jest src/lib/__tests__/api-session.test.ts`
Expected: FAIL (`mod.refreshOutcome is not a function`).

- [ ] **Step 3: Implement `refreshOutcome` / `refreshSession` in `api.ts`** — la promesse partagée `refreshing` devient `Promise<RefreshOutcome> | null`. Dans `run` : `fetch(..., { method: 'POST', credentials: 'include', signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS) })` ; `response.ok` → `'ok'` ; statut `>= 500` → `'unreachable'` ; autre statut non-ok → `'denied'` ; exception (réseau, timeout) → `'unreachable'`. Le token mémoire est mis à `null` pour tout résultat autre que `'ok'`.

- [ ] **Step 4: Run to verify they pass (anciens tests inclus)**

Run: `cd app && npx jest src/lib/__tests__/api-session.test.ts`
Expected: PASS, y compris « deux 401 simultanés… » et « refresh en échec ».

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/api.ts app/src/lib/__tests__/api-session.test.ts
git commit -m "fix(app): refresh de session distingue refusé/injoignable et plafonne l'attente"
```

---

### Task 2: La restauration de session expose l'échec et peut être relancée

**Files:**
- Modify: `app/src/lib/auth-context.tsx` (type `AuthContextValue`, effet de restauration, valeur du provider)
- Test: `app/src/lib/__tests__/auth-context.test.tsx`

**Interfaces:**
- Consumes: `refreshOutcome(): Promise<RefreshOutcome>`, `ApiError` (`status: number`) depuis `./api`.
- Produces: `AuthContextValue` gagne `restoreFailed: boolean` et `retryRestore: () => void`. Règles : `'ok'` + `api.me()` réussi → user ; `'denied'` → anonyme ; `'unreachable'` → `restoreFailed = true` ; `api.me()` qui lève une `ApiError` 401 → anonyme (token effacé), toute autre erreur → `restoreFailed = true`. `isLoading` repasse à `false` dans tous les cas. `retryRestore()` remet `restoreFailed = false` et `isLoading = true` puis relance l'effet (compteur d'essais en dépendance).

- [ ] **Step 1: Update the mock and write the failing tests** — dans la factory `jest.mock('@/lib/api')` : remplacer `refreshSession` par `refreshOutcome: () => mockOutcome()` (`const mockOutcome = jest.fn().mockResolvedValue('ok')`), faire de `me` un `jest.fn` (`mockMe`, par défaut un utilisateur), et ajouter `ApiError: class extends Error { constructor(public status: number, m: string) { super(m); } }`. `Probe` affiche en plus `restoreFailed`. Nouveaux tests :
  - `refus (denied) : anonyme, pas d'erreur` → texte `anonyme`, `restoreFailed` false.
  - `injoignable : restoreFailed vrai et isLoading faux`.
  - `retryRestore relance et récupère la session` : outcome `'unreachable'` puis `'ok'` ; après `act(() => retryRestore())` → `a@b.c`, `restoreFailed` false.
  - `me() en 401 → anonyme` et `me() en 500 → restoreFailed vrai`.

- [ ] **Step 2: Run to verify they fail**

Run: `cd app && npx jest src/lib/__tests__/auth-context.test.tsx`
Expected: FAIL (`restoreFailed` indéfini ; le code appelle encore `refreshSession`).

- [ ] **Step 3: Implement in `auth-context.tsx`** — état `restoreFailed` + `attempt`, effet décrit dans *Interfaces*, `retryRestore` exposé dans la valeur du Provider.

- [ ] **Step 4: Run the whole front suite**

Run: `cd app && npm test`
Expected: PASS (aucun autre fichier n'importe `refreshSession` depuis `auth-context`).

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/auth-context.tsx app/src/lib/__tests__/auth-context.test.tsx
git commit -m "fix(app): échec de restauration de session distinct de la déconnexion, avec relance"
```

---

### Task 3: Splash HTML, retrait par le JS, état d'erreur dans le layout

**Files:**
- Create: `app/src/lib/splash.ts`
- Test: `app/src/lib/__tests__/splash.test.ts`
- Modify: `app/public/index.html` (splash + CSS + script du message d'attente)
- Modify: `app/src/app/_layout.tsx:14-62`

**Interfaces:**
- Consumes: `useSession()` → `{ isLoading, restoreFailed, retryRestore }` (Task 2) ; `ErrorState` (`@/components/ui`, props `message`, `onRetry`) ; `Colors` (`@/constants/theme`).
- Produces: `export function hideSplash(): void` (idempotente, sans effet si `document` ou `#splash` absent).

- [ ] **Step 1: Write the failing test** — `splash.test.ts`, `jest.useFakeTimers()`, `globalThis.document` remplacé par `{ getElementById: () => el }` avec `el = { classList: { add: jest.fn() }, remove: jest.fn() }` :
  - `hideSplash ajoute splash-hide puis retire l'élément à 250 ms` : `expect(el.classList.add).toHaveBeenCalledWith('splash-hide')`, `el.remove` non appelé à 249 ms, appelé à 250 ms.
  - `hideSplash ne lève pas sans document ni sans #splash` : `document` supprimé, puis `getElementById` renvoyant `null`.

- [ ] **Step 2: Run to verify it fails**

Run: `cd app && npx jest src/lib/__tests__/splash.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implement `hideSplash(): void` in `src/lib/splash.ts`** — `getElementById('splash')`, ajoute la classe `splash-hide`, `setTimeout(() => el.remove(), 250)`.

- [ ] **Step 4: Run to verify it passes**

Run: `cd app && npx jest src/lib/__tests__/splash.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the splash to `public/index.html`** — dans `<body>`, **avant** `<div id="root">` (frère, pas enfant : React vide `#root` au premier rendu) :
  - `<div id="splash" role="status" aria-label="Chargement">` contenant `<img src="/icons/icon-192.png" width="96" height="96" alt="">` et `<p id="splash-msg" hidden></p>`.
  - Dans `<head>`, un `<style>` : `#splash` en `position: fixed; inset: 0; z-index: 9999`, centré en colonne, fond/texte clairs par défaut ; variante sombre selon la contrainte globale (`@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) #splash {…} }` et `:root[data-theme="dark"] #splash {…}`) ; `#splash.splash-hide { opacity: 0; transition: opacity 200ms; pointer-events: none; }` ; `#splash-msg` en texte secondaire, centré, marge au-dessus de l'icône, `max-width: 280px`.
  - Un `<script>` inline en fin de `<body>` : `setTimeout` de 6 000 ms qui, si `#splash` existe encore, renseigne `#splash-msg` avec le message d'attente (contrainte globale) et retire `hidden`.

- [ ] **Step 6: Update `_layout.tsx`** —
  - `const [fontsLoaded, fontError] = useFonts(AppFontSources)` et `if (!fontsLoaded && !fontError) return null` (police système si le chargement échoue ; le splash reste visible pendant ce temps).
  - Dans `RootNavigator` : `useEffect(() => { if (!isLoading) hideSplash(); }, [isLoading])` ; `if (restoreFailed) return <ErrorState message="Impossible de joindre le serveur. Réessayez dans un instant." onRetry={retryRestore} />` ; remplacer `if (isLoading) return null` par un `View` plein écran centré avec un `ActivityIndicator` (couleur `Colors[scheme].textSecondary`, même schéma que `ErrorState`) — invisible au premier chargement (le splash le recouvre), visible pendant un « Réessayer ».
  - Ne pas toucher à `AnimatedSplashOverlay` (retourne déjà `null` sur le web via `animated-icon.web.tsx`).

- [ ] **Step 7: Run lint and tests**

Run: `cd app && npm run lint && npm test`
Expected: PASS, aucun avertissement nouveau.

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/splash.ts app/src/lib/__tests__/splash.test.ts app/public/index.html app/src/app/_layout.tsx
git commit -m "fix(app): splash dès le HTML, retiré quand l'app est prête, erreur avec réessayer"
```

---

### Task 4: Vérification dans un navigateur et mise à jour du graphe

**Files:** aucun fichier de code ; `graphify-out/` mis à jour par la commande.

- [ ] **Step 1: Build et servir la PWA**

Run: `cd app && EXPO_PUBLIC_VAPID_PUBLIC_KEY=<clé de app/.env> npm run build:web && npx --yes serve -s dist -l 4173`
Expected: build sans erreur ; `http://localhost:4173` répond. Noter la taille du bundle : `ls -lh dist/_expo/static/js/web/*.js` (si le fichier dépasse ~2 Mo, le noter dans le compte rendu : le découpage du bundle serait le levier suivant, hors périmètre).

- [ ] **Step 2: Splash immédiat, réseau lent** — navigateur avec réseau « Slow 3G » : le splash (icône sur blanc) est visible avant la fin du téléchargement du bundle ; aucun écran blanc à aucun moment.

- [ ] **Step 3: Réveil simulé** — intercepter `**/api/auth/refresh` avec un délai de 10 s : le message d'attente apparaît à ~6 s, puis l'app s'affiche (sign-in ou accueil) et le splash disparaît en fondu.

- [ ] **Step 4: Injoignable** — faire répondre `**/api/auth/refresh` en 503 : écran « Impossible de joindre le serveur… » + « Réessayer » ; rétablir l'API puis cliquer « Réessayer » : indicateur de chargement (pas de blanc), puis l'app. Vérifier qu'avec un cookie valide l'utilisateur n'est **pas** renvoyé vers sign-in.

- [ ] **Step 5: Police en échec** — bloquer les requêtes de fichiers `.ttf` : l'app s'affiche en police système après l'échec, sans blanc permanent.

- [ ] **Step 6: Mode sombre** — émulation `prefers-color-scheme: dark` : le splash est noir dès le premier rendu, sans flash blanc.

- [ ] **Step 7: Mettre à jour le graphe**

Run: `cd app && graphify update .`
Expected: terminé sans erreur.

---

## Hors périmètre (décidés)

- Pas de ping keep-alive ni de passage au plan payant de Render : le blanc dû au réveil est géré par le splash + message + erreur.
- Pas de rendu optimiste de l'app avant la fin de la restauration de session.
- Pas de modification du service worker (navigations déjà « réseau d'abord » ; un cache périmé masquerait les nouveaux déploiements).
- Pas de découpage du bundle JS (mesuré en Task 4 pour décision ultérieure).
- Limite connue : si le bundle JS lui-même ne charge jamais (404 après déploiement, JS bloqué), le splash et son message restent à l'écran ; c'est un blanc de moins, pas une récupération.

## Coordination

`2026-11-10-segments-et-theme.md` est fusionné dans `main` (PR #6) : `index.html` pose déjà `data-theme` sur `<html>` avant le JS et `_layout.tsx` importe `useColorScheme` depuis `@/hooks/use-color-scheme`. Ce plan s'appuie dessus (sélecteurs `data-theme` du splash) ; dans `_layout.tsx`, garder cet import pour le schéma de couleurs de l'indicateur de chargement.
