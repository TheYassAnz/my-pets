# Refonte PWA (plan 1/3 : cœur PWA) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer my-pets d'une app mobile iOS/Android en une application web PWA installable, servie par l'API NestJS, avec auth par cookie httpOnly et rappels Web Push + email.

**Architecture:** Le front Expo existant (`app/`, branche `feat/refonte-mvp`, 5 écrans MVP) est conservé et exporté en web (SPA, `react-native-web`) ; tout le code natif et hors-MVP est supprimé. L'API NestJS passe sous le préfixe `/api`, sert le build statique du front sur le même domaine (Railway), stocke le refresh token dans un cookie httpOnly et remplace Expo Push par Web Push (VAPID) doublé d'un email quotidien (Resend).

**Tech Stack:** Expo SDK 56 (cible web uniquement) · react-native-web · NativeWind · NestJS 11 · Prisma 5 · `web-push` · `@nestjs/serve-static` · Resend · service worker écrit à la main (pas de workbox).

**Spec:** pas de document séparé — les décisions validées par Yassine le 2026-11-09 sont la section suivante et font autorité.

## Décisions validées (spec)

| Sujet | Décision |
|---|---|
| Front | Garder Expo, cible web. Plus aucune cible iOS/Android. |
| Écrans | Les 5 écrans MVP de `feat/refonte-mvp` (connexion/inscription, Mes animaux, création/modification d'animal, fiche animal, nouvelle entrée) + mot de passe oublié + export PDF. |
| API | Auth par cookie httpOnly · Web Push + email · suppression du hors-MVP. |
| Rappels | Web Push **et** email. Sur iOS le push n'arrive que si la PWA est installée : l'email couvre ce cas. |
| Hors ligne | Installable, connexion requise. Le service worker ne met en cache que l'interface, jamais les données. |
| Hébergement | Front servi par l'API sur Railway, même origine. |

**Hors de ce plan (plans séparés, à écrire après celui-ci) :**
- **Plan 2 — mise en page desktop** (barre latérale, liste + détail) : demande d'abord des maquettes. Ici, le contenu est simplement centré dans une colonne de 480 px max sur grand écran.
- **Plan 3 — vrai foyer multi-utilisateurs** (partage d'un animal entre comptes) : demande d'abord une spec (modèle de données, invitations, droits). Ici, le faux `HouseholdMember` est supprimé.

## Global Constraints

- **Deux dépôts git distincts** : `api/` (branche de départ `develop`) et `app/` (branche de départ `feat/refonte-mvp`). La racine `my-pets/` n'est pas un dépôt. Créer `feat/pwa` dans chacun. Tasks 1-5 → `api/`, Tasks 6-11 → `app/` (sauf mention).
- **Expo a changé** : lire `https://docs.expo.dev/versions/v56.0.0/` et le guide PWA d'Expo avant tout code Expo (cf. `app/AGENTS.md`). Dépendances Expo : `npx expo install`.
- Toutes les routes de l'API sont sous `/api`. Le front appelle `process.env.EXPO_PUBLIC_API_URL` (`/api` en production, `http://localhost:3000/api` en dev).
- Cookie de session : nom `mypets_rt`, `HttpOnly`, `SameSite=Strict`, `Path=/api/auth`, `Secure` si `NODE_ENV === 'production'`, durée `REFRESH_TOKEN_TTL_DAYS` (défaut 30).
- **L'access token ne touche jamais `localStorage`/`sessionStorage`** : mémoire JS uniquement.
- Le service worker ne met **jamais** en cache une requête dont le chemin commence par `/api/`.
- L'extraction IA reste dans l'état actuel (module API conservé, 503 sans clé, `AI_EXTRACTION_ENABLED = false`). Aucun auto-save.
- Contrôles d'accès par `ownerId` inchangés sur tout endpoint conservé.
- UI en **français**, zéro emoji, uniquement les tokens de couleur existants (pas de couleur en dur, pas de `dark:`), cibles interactives ≥ 44 px avec nom accessible.
- Tests app : RNTL 14 (`render` et `fireEvent` sont asynchrones → `await`).
- Vérification de chaque tâche : `npm test` vert, `npm run lint` sans nouvelle erreur, et côté app `npx tsc --noEmit` (objectif **0 erreur** à partir de la Task 6).
- Commits : Conventional Commits en français, un par tâche, terminés par `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.
- Nouvelles variables d'env API : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:…`), `CORS_ORIGIN` (dev uniquement, `http://localhost:8081`). App : `EXPO_PUBLIC_VAPID_PUBLIC_KEY`.

## Review Focus

1. **Deux requêtes (ou deux onglets) rafraîchissent la session en même temps** → avec la rotation, le second refresh échouerait et déconnecterait l'utilisateur. Attendu : un seul refresh, tout le monde reste connecté. *(test : Task 7)*
2. **Un envoi échoue pour un utilisateur** (abonnement push expiré 410, Resend en panne, VAPID absent) → les autres utilisateurs reçoivent quand même leurs rappels, l'abonnement mort est supprimé. *(tests : Task 4)*
3. **Rechargement ou lien direct sur `/animals/<id>`** → la page s'affiche (repli SPA), pas un 404 ; à l'inverse `/api/inconnu` renvoie un 404 JSON, pas `index.html`. *(tests : Task 5)*
4. **Le service worker sert des données périmées ou d'un autre compte** après déconnexion ou nouveau déploiement → `/api/*` jamais intercepté, `index.html` toujours réseau d'abord. *(test : Task 9)*
5. **Endpoint d'abonnement push forgé** (`https://serveur-interne/…`) → l'API ferait des requêtes vers une cible arbitraire (SSRF). Attendu : 400 hors hôtes de push connus. *(test : Task 3)*

---

## File Structure

| Dépôt | Créés | Modifiés | Supprimés |
|---|---|---|---|
| `api/` | `src/auth/refresh-cookie.ts`, `src/auth/auth.controller.spec.ts`, `src/notifications/dto/push-subscription.dto.ts`, `src/notifications/reminders.service.spec.ts`, `src/notifications/notifications.controller.spec.ts`, `src/static.spec.ts`, `client/` (build du front) | `src/main.ts`, `src/app.module.ts`, `src/auth/auth.controller.ts`, `src/notifications/*`, `src/mail/mail.service.ts`, `prisma/schema.prisma`, `README.md` | `src/routines/`, `src/documents/`, `src/household/`, `src/auth/dto/refresh.dto.ts`, `src/notifications/dto/register-push-token.dto.ts` |
| `app/` | `public/manifest.json`, `public/sw.js`, `public/icons/*`, `src/lib/pwa.ts`, `src/components/reminder-prompt.tsx`, `scripts/deploy-web.sh` + tests | `src/lib/api.ts`, `src/lib/auth-context.tsx`, `src/lib/notifications.ts`, `src/lib/export.ts`, `src/app/_layout.tsx`, `src/app/(app)/index.tsx`, `app.json`, `package.json` | `ios/`, `src/lib/db/`, `src/lib/store/`, `src/lib/token-storage.ts`, écrans hors-MVP, fichiers `*.ios.tsx` |

---

## Partie A — API (`api/`)

### Task 1: Suppression du hors-MVP et préfixe `/api`

**Files:** Modify `src/app.module.ts`, `src/main.ts`, `prisma/schema.prisma`, `prisma/seed.ts` · Delete `src/routines/`, `src/documents/`, `src/household/`.

**Interfaces — Produces:** toutes les routes sous `/api/...` ; modèles Prisma restants : `User`, `RefreshToken`, `PasswordResetCode`, `PushToken` (retiré Task 3), `Animal`, `HealthEvent`, `WeightRecord`.

- [ ] **Step 1 :** `git switch -c feat/pwa` depuis `develop`.
- [ ] **Step 2 :** Retirer `RoutinesModule`, `DocumentsModule`, `HouseholdModule` de `app.module.ts` et supprimer leurs dossiers. `grep -rn "routines\|documents\|household" src prisma/seed.ts` ne doit plus rien renvoyer hors commentaires.
- [ ] **Step 3 :** Dans `schema.prisma`, supprimer les modèles `Routine`, `TaskLog`, `Document`, `HouseholdMember` et leurs relations dans `User`/`Animal`. Les colonnes `Animal.dailyRation/food*` et `User.preferredVet*` restent (non destructif).
- [ ] **Step 4 :** `npx prisma migrate dev --name drop_non_mvp`. **Ne pas appliquer en production sans l'accord explicite de Yassine : la migration supprime 4 tables et leurs données.**
- [ ] **Step 5 :** Dans `main.ts` : `app.setGlobalPrefix('api')` ; remplacer `app.enableCors()` par un CORS activé seulement si `CORS_ORIGIN` est défini : `{ origin: process.env.CORS_ORIGIN, credentials: true }`.
- [ ] **Step 6 :** `npm run build && npm test` verts. Commit `refactor(api): supprimer le hors-MVP et préfixer les routes par /api`.

### Task 2: Auth par cookie httpOnly

**Files:** Create `src/auth/refresh-cookie.ts`, `src/auth/auth.controller.spec.ts` · Modify `src/auth/auth.controller.ts` · Delete `src/auth/dto/refresh.dto.ts`.

**Interfaces:**
- Consumes : `AuthService` inchangé (`login`/`register` → `{accessToken, refreshToken, user}`, `refresh(token)` → `{accessToken, refreshToken}`, `logout(token)`).
- Produces (`refresh-cookie.ts`) : `REFRESH_COOKIE = 'mypets_rt'` · `setRefreshCookie(res: Response, token: string, ttlDays: number): void` · `clearRefreshCookie(res: Response): void` · `readRefreshCookie(req: Request): string | undefined` (lecture de l'en-tête `Cookie`, sans dépendance `cookie-parser`).
- Produces (HTTP) : `POST /api/auth/login|register` → `{accessToken, user}` + `Set-Cookie` · `POST /api/auth/refresh` (aucun corps) → `{accessToken}` + nouveau cookie · `POST /api/auth/logout` (aucun corps) → 204 + cookie effacé.

- [ ] **Step 1 : écrire les tests** (`auth.controller.spec.ts`, `@nestjs/testing` + `supertest`, `AuthService` mocké) :

```ts
it('login : accessToken dans le corps, refresh token uniquement en cookie', async () => {
  service.login.mockResolvedValue({ accessToken: 'a1', refreshToken: 'r1', user });
  const res = await request(server).post('/auth/login').send({ email: 'a@b.fr', password: 'motdepasse1' }).expect(200);
  expect(res.body).toEqual({ accessToken: 'a1', user: expect.any(Object) });
  const cookie = res.headers['set-cookie'][0];
  expect(cookie).toMatch(/^mypets_rt=r1;/);
  expect(cookie).toMatch(/HttpOnly/);
  expect(cookie).toMatch(/SameSite=Strict/);
  expect(cookie).toMatch(/Path=\/api\/auth/);
});
it('register : même contrat que login (201)');
it('refresh sans cookie → 401, service non appelé');
it('refresh avec cookie mypets_rt=old → service.refresh("old"), corps {accessToken}, nouveau cookie mypets_rt=<nouveau>');
it('refresh rejeté par le service → 401 et cookie effacé (Max-Age=0)');
it('logout avec cookie → 204, service.logout("old"), cookie effacé');
it('logout sans cookie → 204, service non appelé');
it('cookie Secure présent si NODE_ENV=production, absent sinon');
```

- [ ] **Step 2 :** `npx jest src/auth/auth.controller.spec.ts` → échec.
- [ ] **Step 3 :** Implémenter `refresh-cookie.ts` puis adapter le contrôleur (`@Res({ passthrough: true })`, `@Req()`).
- [ ] **Step 4 :** Tests verts. Commit `feat(auth): refresh token en cookie httpOnly`.

### Task 3: Abonnements Web Push

**Files:** Create `src/notifications/dto/push-subscription.dto.ts`, `src/notifications/notifications.controller.spec.ts` · Modify `prisma/schema.prisma`, `src/notifications/notifications.controller.ts`, `src/notifications/notifications.service.ts` · Delete `dto/register-push-token.dto.ts`.

**Interfaces — Produces:**
- Prisma : `PushSubscription { id, endpoint @unique, p256dh, auth, userId, createdAt }` (remplace `PushToken`, relation `User.pushSubscriptions`). Migration `web_push_subscriptions`.
- `PUT /api/notifications/subscription` corps `{ endpoint: string, keys: { p256dh: string, auth: string } }` → 200.
- `DELETE /api/notifications/subscription` corps `{ endpoint: string }` → 204.
- `NotificationsService.saveSubscription(userId, { endpoint, p256dh, auth })` (upsert sur `endpoint` : un appareil qui change de compte est réattribué) · `removeSubscription(userId, endpoint)`.
- `GET/PATCH /api/notifications/settings` inchangés.

- [ ] **Step 1 : tests** (contrôleur + `ValidationPipe`, service mocké) :
  - endpoint `https://fcm.googleapis.com/fcm/send/abc` avec clés → 200, `saveSubscription(userId, {endpoint, p256dh, auth})`.
  - endpoints `https://updates.push.services.mozilla.com/…`, `https://web.push.apple.com/…`, `https://wns2-par02p.notify.windows.com/…` → 200.
  - `https://interne.exemple.fr/x`, `http://fcm.googleapis.com/x`, `https://fcm.googleapis.com.evil.fr/x` → 400, service non appelé.
  - clés manquantes → 400. Sans JWT → 401.
- [ ] **Step 2 :** échec constaté.
- [ ] **Step 3 :** DTO avec validation de l'hôte : `https` obligatoire et hôte égal à, ou sous-domaine de, `fcm.googleapis.com`, `push.services.mozilla.com`, `push.apple.com`, `notify.windows.com`. Adapter service, contrôleur, schéma ; lancer la migration.
- [ ] **Step 4 :** Tests verts. Commit `feat(notifications): abonnements Web Push`.

### Task 4: Rappels quotidiens push + email

**Files:** Create `src/notifications/reminders.service.spec.ts` · Modify `src/notifications/reminders.service.ts`, `src/notifications/notifications.module.ts`, `src/mail/mail.service.ts`, `package.json` (`npm i web-push` + `@types/web-push` en dev).

**Interfaces:**
- Consumes : `PushSubscription` (Task 3), `MailService`.
- Produces : `MailService.sendReminderDigest(email: string, lines: string[]): Promise<void>` — sujet `Rappels santé my-pets`, corps texte = une ligne par rappel, lève une exception si Resend renvoie `error`.
- Charge utile push (JSON) : `{ title: string, body: string, url: string }` avec `title = "Rappel santé — <animal>"`, `body = "<titre> aujourd'hui" | "<titre> dans N jour(s)"`, `url = "/animals/<animalId>"`.
- Ligne d'email : `"<animal> — <body>"`.
- La règle de sélection (cron `0 8 * * *`, `reminderLeadDays.includes(daysUntil)`, horizon 60 j) ne change pas.

- [ ] **Step 1 : tests** (`prisma`, `MailService` mockés, `jest.mock('web-push')`) :
  - échéance à J-15, propriétaire `[15, 1]`, 2 abonnements → `sendNotification` ×2 avec charge `{title:'Rappel santé — Rex', body:'Vaccin rage dans 15 jours', url:'/animals/a1'}` ; `sendReminderDigest('a@b.fr', ['Rex — Vaccin rage dans 15 jours'])` ×1.
  - échéance à J-10 → aucun envoi. Échéance à J-0 → `body` se termine par `aujourd'hui`. J-1 → `dans 1 jour`.
  - deux échéances pour le même propriétaire → **un seul** email à 2 lignes.
  - `sendNotification` rejette `{statusCode: 410}` (puis 404) sur l'abonnement 1 → `pushSubscription.delete` pour lui, abonnement 2 envoyé, email envoyé.
  - `sendNotification` rejette `{statusCode: 500}` → abonnement **conservé**.
  - `sendReminderDigest` rejette pour le propriétaire A → B reçoit push et email ; `sendDueReminders()` se résout sans lever.
  - `VAPID_PUBLIC_KEY` absent → aucun `sendNotification`, emails envoyés, pas d'exception au démarrage.
  - propriétaire sans abonnement → email seul.
- [ ] **Step 2 :** échec constaté.
- [ ] **Step 3 :** Réécrire `RemindersService` : regrouper par propriétaire, `try/catch` par envoi ; `webpush.setVapidDetails` au constructeur seulement si les 3 variables VAPID sont présentes ; supprimer tout le code Expo Push. Importer `MailModule` dans `NotificationsModule`.
- [ ] **Step 4 :** Tests verts. Générer les clés pour le dev : `npx web-push generate-vapid-keys` → `api/.env` (ne pas committer). Documenter les 3 variables dans `README.md`.
- [ ] **Step 5 :** Commit `feat(notifications): rappels par Web Push et email`.

### Task 5: Servir le front depuis l'API

**Files:** Create `src/static.spec.ts`, `client/.gitkeep` · Modify `src/app.module.ts`, `package.json` (`npm i @nestjs/serve-static`), `nest-cli.json` si nécessaire.

**Interfaces — Produces:** `api/client/` = racine statique (remplie par `app/scripts/deploy-web.sh`, Task 11). Tout chemin hors `/api` sans fichier correspondant renvoie `client/index.html`.

- [ ] **Step 1 : tests** (`supertest` sur l'`AppModule` avec préfixe `api`, `rootPath` pointé sur un dossier temporaire contenant `index.html` = `<p>shell</p>` et `sw.js`) :
  - `GET /` → 200, contient `shell`.
  - `GET /animals/123` → 200, contient `shell` (repli SPA).
  - `GET /sw.js` → 200, `content-type` JavaScript, en-tête `Cache-Control: no-cache`.
  - `GET /index.html` → `Cache-Control: no-cache`.
  - `GET /api/inconnu` → 404 JSON, **pas** `shell`.
  - `GET /api/auth/me` sans jeton → 401.
- [ ] **Step 2 :** échec constaté.
- [ ] **Step 3 :** `ServeStaticModule.forRoot({ rootPath: process.env.CLIENT_DIR ?? join(__dirname, '..', 'client'), exclude: ['/api/{*path}'], serveStaticOptions: { setHeaders } })` — `setHeaders` pose `no-cache` sur `index.html`, `sw.js` et `manifest.json` (les fichiers hachés `/_expo/static/*` gardent le cache par défaut).
- [ ] **Step 4 :** Tests verts. Commit `feat(api): servir la PWA sur la même origine`.

---

## Partie B — Front (`app/`)

### Task 6: Suppression du natif et du hors-MVP

**Files:** Delete `ios/`, `src/lib/db/`, `src/lib/store/`, `src/components/ui/species-picker.ios.tsx`, `src/app/(app)/notifications-permission.tsx`, et tous les écrans de `src/app/(app)/` non atteignables depuis les 5 écrans MVP (`account-data`, `appointment-detail`, `calendar`, `document-viewer`, `documents`, `health`, `invitation`, `notifications`, `search`, `settings`, `share-record`, `stats`, `treatments`, `animals/[id]/feeding`, `animals/[id]/timeline`, `animals/[id]/weight`) avec leurs tests et les composants qu'ils étaient seuls à utiliser · Modify `src/lib/api.ts`, `package.json`, `app.json`.

- [ ] **Step 1 :** `git switch -c feat/pwa` depuis `feat/refonte-mvp`. Lister les écrans réellement atteints : partir de `src/app/(app)/index.tsx` et des écrans d'auth, suivre chaque `router.push`/`<Link>`. Tout écran hors de cette liste est supprimé ; la liste de l'en-tête **Files** est indicative, c'est l'atteignabilité qui tranche. `animals/[id]/events/scan.tsx` est **conservé** (derrière `AI_EXTRACTION_ENABLED`).
- [ ] **Step 2 :** Dans `api.ts`, supprimer les types et méthodes des endpoints retirés (routines, tâches du jour, documents, foyer, `registerPushToken`/`removePushToken`).
- [ ] **Step 3 :** Désinstaller `@nozbe/watermelondb` et `expo-glass-effect` ; désinstaller `zustand`, `expo-symbols`, `@expo/ui`, `react-native-svg` **uniquement** si `grep` ne trouve plus d'import. **Ne pas** toucher ici à `expo-secure-store`, `expo-notifications`, `expo-device`, `expo-sharing`, `expo-file-system` : `token-storage.ts`, `notifications.ts` et `export.ts` les importent encore et sont réécrits aux Tasks 7, 8 et 10, qui les désinstallent. Retirer les scripts `ios`/`android` et, dans `app.json`, les blocs `ios`, `android` ; `name` et `slug` → `my-pets`.
- [ ] **Step 4 :** `npx tsc --noEmit` → **0 erreur** ; `npm test` vert ; `npm run lint`.
- [ ] **Step 5 :** Commit `refactor(app): supprimer le natif et les écrans hors MVP`.

### Task 7: Session par cookie, access token en mémoire

**Files:** Modify `src/lib/api.ts`, `src/lib/auth-context.tsx` · Delete `src/lib/token-storage.ts` · Test `src/lib/__tests__/api-session.test.ts`.

**Interfaces:**
- Consumes : contrat HTTP de la Task 2.
- Produces (`api.ts`) : `setAccessToken(token: string | null): void` · `refreshSession(): Promise<boolean>` (pose le nouvel access token ; `false` si la session est perdue) · `type AuthResponse = { accessToken: string; user: User }` · `api.logout(): Promise<void>` sans argument. `storeTokens`/`clearTokens` disparaissent.

- [ ] **Step 1 : tests** (`global.fetch` mocké) :
  - chaque requête part avec `credentials: 'include'` et `Authorization: Bearer <token mémoire>` ; sans token, pas d'en-tête.
  - **deux requêtes simultanées reçoivent 401 → exactement un `POST /auth/refresh`**, puis les deux sont rejouées avec le nouveau token et réussissent.
  - refresh en échec → la requête rejette `ApiError` 401 et le token mémoire est `null`.
  - une requête rejouée qui reprend 401 ne relance pas de refresh (pas de boucle).
  - `refreshSession()` passe par `navigator.locks.request('mypets-refresh', …)` quand `navigator.locks` existe, et fonctionne sans.
  - après toute l'exécution, `localStorage` ne contient aucune clé `mypets.*`.
- [ ] **Step 2 :** échec constaté.
- [ ] **Step 3 :** Implémenter : variable de module pour le token ; promesse de refresh partagée (un seul vol dans l'onglet) enveloppée dans le verrou Web Locks (un seul vol entre onglets — le cookie étant partagé, l'onglet suivant rafraîchit avec le cookie déjà tourné).
- [ ] **Step 4 :** `auth-context.tsx` : au démarrage `refreshSession()` puis `api.me()` si `true` ; `signIn`/`signUp` → `setAccessToken(res.accessToken)` ; `signOut` → `api.logout()` puis `setAccessToken(null)`. Retirer l'enregistrement push automatique à la connexion (remplacé Task 10).
- [ ] **Step 5 :** Tests verts, `tsc` 0 erreur. Commit `feat(auth): session par cookie httpOnly côté web`.

### Task 8: Export PDF en téléchargement navigateur

**Files:** Modify `src/lib/export.ts`, `src/lib/api.ts` · Test `src/lib/__tests__/export.test.ts`.

**Interfaces — Produces:** `api.downloadHealthRecord(animalId: string): Promise<Blob>` (même chemin d'auth et de refresh que `request`) · `exportAndShareHealthRecord(animalId, animalName): Promise<void>` — signature inchangée pour les appelants.

- [ ] **Step 1 : tests** : appelle `GET /animals/a1/export` avec le Bearer ; crée un lien `download="carnet-rex-le-chien.pdf"` pour `"Rex le Chien"` et le clique ; révoque l'URL objet ; une réponse 404 rejette `ApiError` sans créer de lien.
- [ ] **Step 2-4 :** échec → implémenter (`URL.createObjectURL` + `<a download>`, plus d'`expo-file-system`/`expo-sharing`) → vert. Désinstaller ces deux paquets.
- [ ] **Step 5 :** Commit `feat(export): téléchargement du carnet PDF dans le navigateur`.

### Task 9: Coque PWA (manifest, icônes, service worker)

**Files:** Create `public/manifest.json`, `public/sw.js`, `public/icons/{icon-192.png,icon-512.png,icon-maskable-512.png,apple-touch-icon.png}`, `src/lib/pwa.ts`, `src/lib/__tests__/sw.test.ts` · Modify `app.json`, `src/app/_layout.tsx`, gabarit HTML web (selon le guide PWA Expo v56).

**Interfaces — Produces:** `registerServiceWorker(): Promise<ServiceWorkerRegistration | null>` dans `pwa.ts` (`null` si non supporté ou hors `https`/`localhost`), appelée une fois dans le layout racine. `sw.js` affiche les notifications dont la charge est `{title, body, url}` (Task 4).

- [ ] **Step 1 :** `app.json` → `web.output: "single"` (SPA : un seul `index.html`, compatible avec le repli de la Task 5).
- [ ] **Step 2 :** `manifest.json` : `name` et `short_name` `my-pets`, `lang` `fr`, `start_url` `/`, `scope` `/`, `display` `standalone`, `background_color` et `theme_color` = valeur `background` du thème clair de `src/constants/theme.ts`, les 3 icônes (dont une `purpose: "maskable"`). Icônes générées depuis `assets/images/icon.png` avec `sips -z`.
- [ ] **Step 3 :** Le `<head>` web doit contenir `<link rel="manifest" href="/manifest.json">`, `<meta name="theme-color">`, `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, `lang="fr"`.
- [ ] **Step 4 : test du service worker** (`sw.test.ts` : charger `public/sw.js` dans un `vm` avec un faux `self` qui capture les écouteurs) :
  - `fetch` vers `/api/animals` (GET) et tout `POST` → `respondWith` **jamais** appelé.
  - `fetch` vers `/_expo/static/js/web/entry-abc.js` → `respondWith` appelé (cache d'abord).
  - requête de navigation (`mode: 'navigate'`) → réseau d'abord ; si le réseau rejette, renvoie le `/index.html` en cache.
  - `push` avec `{title:'T', body:'B', url:'/animals/a1'}` → `showNotification('T', { body:'B', data:{ url:'/animals/a1' }, icon:'/icons/icon-192.png' })`.
  - `push` sans données ou JSON invalide → aucune exception.
  - `notificationclick` → ferme la notification et `clients.openWindow('/animals/a1')` ; une `url` qui ne commence pas par `/` est remplacée par `/`.
- [ ] **Step 5 :** échec constaté, puis écrire `sw.js` (JS simple, sans import) et `pwa.ts`. Tests verts.
- [ ] **Step 6 : vérification du build** : `npx expo export -p web` puis `test -f dist/manifest.json && test -f dist/sw.js && grep -q 'rel="manifest"' dist/index.html`.
- [ ] **Step 7 :** Commit `feat(pwa): manifest, icônes et service worker`.

### Task 10: Activation des rappels push dans le navigateur

**Files:** Modify `src/lib/notifications.ts`, `src/lib/api.ts`, `src/lib/auth-context.tsx`, `src/app/(app)/index.tsx` · Create `src/components/reminder-prompt.tsx` · Tests `src/lib/__tests__/notifications.test.ts`, `src/components/__tests__/reminder-prompt.test.tsx`.

**Interfaces:**
- Consumes : `registerServiceWorker()` (Task 9), endpoints Task 3, `EXPO_PUBLIC_VAPID_PUBLIC_KEY`.
- Produces : `pushSupported(): boolean` · `enablePushReminders(): Promise<'granted' | 'denied' | 'unsupported'>` · `disablePushReminders(): Promise<void>` · `api.savePushSubscription(sub: PushSubscriptionJSON)` · `api.removePushSubscription(endpoint: string)` · `<ReminderPrompt />`.

- [ ] **Step 1 : tests `notifications`** :
  - sans `PushManager` → `pushSupported()` `false`, `enablePushReminders()` → `'unsupported'`, aucun appel API.
  - permission accordée → `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` puis `api.savePushSubscription` avec `{endpoint, keys:{p256dh, auth}}` → `'granted'`.
  - permission refusée → `'denied'`, aucun appel API.
  - `disablePushReminders()` → `api.removePushSubscription(endpoint)` puis `subscription.unsubscribe()` ; sans abonnement → rien ; si l'API échoue, ne lève pas (la déconnexion doit aboutir).
- [ ] **Step 2 : tests `ReminderPrompt`** :
  - permission `default` et push supporté → bouton `Activer les rappels` ; au clic → `enablePushReminders()` appelé ; après `'granted'` le composant disparaît.
  - iPhone/iPad non installé (push non supporté, pas en mode `standalone`) → texte `Pour recevoir les rappels sur iPhone, ajoutez my-pets à l'écran d'accueil (Partager, puis « Sur l'écran d'accueil »). Vous les recevez aussi par email.` et aucun bouton.
  - permission `granted` ou `denied`, ou push non supporté hors iOS → ne rend rien.
- [ ] **Step 3-4 :** échec → implémenter → vert. L'activation se fait **uniquement** sur clic (exigence iOS/Safari), jamais automatiquement à la connexion. `signOut` appelle `disablePushReminders()` avant `api.logout()`. Placer `<ReminderPrompt />` en tête de la liste de « Mes animaux ». Désinstaller `expo-notifications`, `expo-device`, `expo-secure-store` s'il n'y a plus d'import.
- [ ] **Step 5 :** Commit `feat(rappels): activation des notifications Web Push`.

### Task 11: Passe web des écrans, déploiement et documentation

**Files:** Create `scripts/deploy-web.sh` · Modify les écrans/composants qui échouent à la passe ci-dessous, `src/app/_layout.tsx` (colonne centrée), `my-pets/CLAUDE.md`, `my-pets/.claude/roadmap-mvp.md`, `app/README.md`.

- [ ] **Step 1 :** Colonne centrée : le contenu de l'app est limité à `max-width: 480px` et centré quand la fenêtre est plus large (un seul conteneur dans le layout racine).
- [ ] **Step 2 : passe manuelle dans le navigateur** (API en local + `npm run web`), en 375 px et 1280 px, thème clair et sombre. Pour chacun des écrans — inscription, connexion, mot de passe oublié/réinitialisation, Mes animaux, nouvel animal, modification, fiche animal, nouvelle entrée ×4 types — vérifier et corriger :
  - le formulaire se soumet avec la touche Entrée et au clic ; les erreurs s'affichent ;
  - le champ date ouvre un sélecteur de date natif du navigateur (`<input type="date">`) et la valeur enregistrée est la bonne ;
  - le choix de photo ouvre le sélecteur de fichiers, l'aperçu s'affiche, l'upload aboutit ;
  - le sélecteur d'espèce fonctionne à la souris et au clavier ;
  - navigation au clavier (Tab) avec focus visible ; bouton Précédent du navigateur ; rechargement de la page sur chaque route sans perte de session ;
  - aucune erreur dans la console.
- [ ] **Step 3 :** `scripts/deploy-web.sh` : `EXPO_PUBLIC_API_URL=/api npx expo export -p web`, puis remplace le contenu de `../api/client/` par `dist/`. Ajouter le script npm `deploy:web`. L'exécuter et committer `client/` **dans le dépôt `api/`** (`chore(client): build PWA`).
- [ ] **Step 4 : vérification de bout en bout** : `cd ../api && npm run build && npm run start:prod`, ouvrir `http://localhost:3000` : connexion, rechargement sur `/animals/<id>`, export PDF, activation des rappels, puis déclencher `RemindersService.sendDueReminders()` avec une échéance à J-1 → la notification s'affiche et son clic ouvre la fiche. Audit Lighthouse « installable » sans erreur.
- [ ] **Step 5 :** Mettre à jour `CLAUDE.md` et `roadmap-mvp.md` : PWA à la place de l'app mobile, stack, commandes, variables d'env, phases 5 et 7 (plus de stores ; déploiement Railway), mention des plans 2 et 3.
- [ ] **Step 6 :** Commit `feat(pwa): passe web des écrans et script de déploiement` (app) et commit de la doc.

**Mise en production (action humaine, après accord) :** variables Railway (`VAPID_*`, `NODE_ENV=production`), sauvegarde de la base, `npx prisma migrate deploy`, déploiement de la branche `api`.
