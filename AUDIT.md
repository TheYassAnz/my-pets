# Audit Technique & Fonctionnel — Projet `my-pets`

> **Date de l'audit** : 4 septembre 2026  
> **Auteur** : Antigravity  
> **Périmètre** : Backend API (`api/`), Application Mobile (`app/`), Documentation & Roadmap (`.claude/`, `plan-ux-ui.md`)  
> **Stack analysée** : NestJS 11 + Prisma 5 / Expo SDK 56 + React Native 0.85 + React 19

---

## Sommaire

1. [Synthèse Globale & Note de Maturité](#1-synthèse-globale--note-de-maturité)
2. [Architecture & Organisation du Projet](#2-architecture--organisation-du-projet)
3. [Audit du Backend (`api/`)](#3-audit-du-backend-api)
   - [Points forts](#points-forts-api)
   - [Sécurité & Authentification](#sécurité--authentification)
   - [Robustesse & Logique Métier](#robustesse--logique-métier)
   - [Couverture de Tests API](#couverture-de-tests-api)
4. [Audit du Frontend Mobile (`app/`)](#4-audit-du-frontend-mobile-app)
   - [Points forts](#points-forts-mobile)
   - [UI / UX & État de la Refonte](#ui--ux--état-de-la-refonte)
   - [Gestion Réseau & Résilience](#gestion-réseau--résilience)
   - [Configuration Store & Natif](#configuration-store--natif)
   - [Couverture de Tests Mobile](#couverture-de-tests-mobile)
5. [Audit DevOps, CI/CD & Environnements](#5-audit-devops-cicd--environnements)
6. [Matrice des Risques & Vulnérabilités](#6-matrice-des-risques--vulnérabilités)
7. [Plan d'Action Recommandé (Priorisation)](#7-plan-daction-recommandé-priorisation)

---

## 1. Synthèse Globale & Note de Maturité

Le projet **my-pets** est une application bien conçue, bâtie sur des choix technologiques modernes et cohérents. Le pivot documenté vers une **API custom NestJS + Prisma** (au lieu d'un backend-as-a-service 100% Supabase) offre un contrôle total sur les règles de gestion, l'authentification et l'isolation des données des utilisateurs.

### Notes d'évaluation par domaine (sur 10)

| Domaine | Note | Appréciation |
|---|---|---|
| **Architecture globale** | **8.5/10** | Découpage 3-tiers clair, séparation des responsabilités nette, DTOs stricts. |
| **Sécurité (Auth & Données)** | **6.5/10** | Bonne base (Argon2, refresh tokens rotatifs hachés), mais absence de rate limiting, upload peu bridé et CORS permissif. |
| **Qualité du code Frontend** | **8.5/10** | TypeScript strict, React Compiler, Design System soigné inspiré de Trade Republic, 106 tests UI unitaires. |
| **Qualité du code Backend** | **7.0/10** | NestJS propre et idiomatique, mais très peu de tests unitaires (5 tests) et requêtes DB parfois redondantes. |
| **Ergonomie / UX** | **7.5/10** | Excellente direction sur l'accueil (échéances), mais fiches animaux encore en version hybride (consultation + édition active). |
| **DevOps & CI/CD** | **3.0/10** | Pas de CI/CD (GitHub Actions), pas de conteneurisation Docker, pas de `.env.example`, deux dépôts Git dissociés. |
| **Préparation Stores (Phase 7)** | **4.0/10** | Identifiants et permissions génériques dans `app.json`, configuration EAS et notifications push à finaliser. |

---

## 2. Architecture & Organisation du Projet

### Organisation multi-dépôts
Le répertoire racine `/Users/theyassanz/DEV/PERSO/my-pets` contient deux dépôts Git indépendants :
- `api/.git`
- `app/.git`

**Constat** :
- La racine n'est pas un dépôt Git parent (pas de sous-modules ni de monorepo unifié type Turborepo / Nx / npm workspaces).
- Cela complique les commits synchronisés (ex: lorsqu'un changement API impacte le client mobile).

### Schéma de flux
Le flux trois tiers est strictement respecté :
```
App Mobile (Expo / React Native)
        │
        │ HTTPS + JWT Bearer
        ▼
API Métier (NestJS 11 + Prisma)
  ├─ Authentification custom (Argon2, tokens SHA-256 rotatifs)
  ├─ Contrôle d'accès applicatif (ownerId)
  ├─ Cron interne (@nestjs/schedule) → Expo Push
  └─ Intégrations : Supabase Storage (photos), Resend (emails), Claude API (vision)
        │
   ┌────┴──────────────────────────┐
   ▼                               ▼
Supabase PostgreSQL             Supabase Storage
(via Prisma)                    (photos privées/publiques)
```

---

## 3. Audit du Backend (`api/`)

### Points forts API
1. **Validation stricte** : `ValidationPipe` activé globalement avec `whitelist: true` et `transform: true`. Tout champ non prévu par les DTOs est automatiquement rejeté.
2. **Gestion fine du multi-tenant** : Malgré l'absence de RLS Supabase, l'API injecte systématiquement `ownerId` (issu du token JWT validé) dans les requêtes Prisma.
3. **Conception d'authentification robuste** :
   - Hachage de mots de passe avec **Argon2**.
   - Refresh tokens opaques (générés via `randomBytes(48)`), stockés sous forme de condensat **SHA-256** pour parer à toute fuite de base de données.
   - Rotation systématique à chaque rafraîchissement et révocation en cascade lors d'un changement de mot de passe.
4. **Optimisation des requêtes agrégées** : Le endpoint `GET /animals` utilise `groupBy` Prisma pour récupérer les comptes d'événements et les prochaines échéances sans problème de requêtes N+1.

---

### Sécurité & Authentification

#### ⚠️ Vulnérabilités & Points d'attention critiques

1. **Absence de Rate Limiting (`@nestjs/throttler`)** :
   - Endpoints vulnérables : `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`.
   - *Risque* : Attaques par force brute sur les mots de passe, saturation de la boîte mail d'un utilisateur par envoi massif de codes OTP Resend, tentative d'énumération du code à 6 chiffres (1 000 000 combinaisons).
   - *Recommandation* : Intégrer `@nestjs/throttler` avec des limites sévères sur `/auth/*` (ex: 5 requêtes/minute sur forgot-password).

2. **Absence de limitation de longueur sur le mot de passe (`@MaxLength`)** :
   - Dans `RegisterDto`, seule `@MinLength(8)` est présente.
   - *Risque* : Déni de service (DoS) par épuisement CPU. Argon2 étant gourmand en calcul, l'envoi d'un payload avec un mot de passe de plusieurs mégaoctets bloque le thread Node.js.
   - *Recommandation* : Ajouter `@MaxLength(100)` ou `@MaxLength(128)` dans `RegisterDto` et `ResetPasswordDto`.

3. **Validation insuffisante sur l'upload de photos (`animals.controller.ts`)** :
   - Seule la taille est limitée (`5 Mo`). Aucun filtre sur le type MIME (`fileFilter` Multer ou `ParseFilePipe` NestJS avec `FileTypeValidator`).
   - L'extension de fichier est extraite de `file.originalname` sans assainissement (`file.originalname.split('.').pop()`).
   - *Risque* : Upload de fichiers SVG avec scripts XSS embarqués ou de fichiers exécutables servis sur le CDN public Supabase.
   - *Recommandation* : Restreindre strictement aux types `image/jpeg`, `image/png`, `image/webp` et forcer l'extension en fonction du MIME type validé.

4. **Fuite d'information par timing / code d'erreur sur `forgot-password`** :
   - `AuthService.forgotPassword` gère l'anti-énumération côté DB en retournant silencieusement si l'utilisateur n'existe pas. En revanche, si l'utilisateur existe et que le service `MailService` échoue, une exception `InternalServerErrorException` (HTTP 500) est levée, révélant la présence de l'email.
   - *Recommandation* : Isoler l'envoi d'email dans un bloc try/catch avec log d'erreur, sans altérer la réponse HTTP 204.

5. **Énumération d'identifiants via `assertOwned`** :
   - `assertOwned` lève `NotFoundException` (404) si l'ID n'existe pas, mais `ForbiddenException` (403) si l'ID existe et appartient à un tiers.
   - *Risque* : Permet à un utilisateur malveillant de tester des UUIDs pour vérifier s'ils existent dans le système.
   - *Recommandation* : Renvoyer un `NotFoundException` identique dans les deux situations.

6. **Configuration CORS et En-têtes HTTP** :
   - `app.enableCors()` sans paramètre ouvre l'API à tous les domaines (`Access-Control-Allow-Origin: *`).
   - Absence de `helmet` pour sécuriser les en-têtes HTTP (X-Content-Type-Options, HSTS, etc.).

---

### Robustesse & Logique Métier

1. **Modèle Claude dans `extraction.service.ts`** :
   - La ligne 101 utilise `model: 'claude-opus-4-8'`.
   - *Problème* : Ce nom de modèle n'est pas un identifiant standard Anthropic en production. À la réactivation de l'IA, l'API renverra une erreur 400 d'Anthropic. Il convient d'utiliser `claude-3-5-sonnet-20241022` ou `claude-3-haiku-20240307` (plus rapide et plus économique pour de l'OCR).
   - *Schéma JSON* : Vérifier la compatibilité de `output_config: { format: { type: 'json_schema' } }` avec la version installée du SDK `@anthropic-ai/sdk`.

2. **Cron des rappels & Scalabilité (`reminders.service.ts`)** :
   - `@Cron('0 8 * * *')` s'exécute à 8h00 UTC sans mécanisme d'idempotence ni verrou distribué.
   - Si plusieurs instances de l'API tournent derrière un load balancer sur Railway, **les rappels push seront envoyés en double**.
   - Le calcul de date (`dueDate.setUTCHours(0,0,0,0)`) ne tient pas compte du fuseau horaire de l'utilisateur (un utilisateur en France à UTC+2 reçoit sa notification à 10h locale).

3. **Génération PDF (`export.service.ts`)** :
   - `formatDate` s'appuie sur le fuseau du serveur Node.js.
   - PDFKit utilise les polices standard Helvetica qui ne supportent pas l'intégralité des glyphes Unicode (émojis, certains caractères accentués ou ligatures).

4. **Multiplication des requêtes DB dans `HealthEventsService`** :
   - Pour chaque `findOne`, `update`, ou `remove`, la méthode effectue d'abord `assertAnimalOwned` (requête 1), puis `getOwnedEvent` (requête 2), puis l'opération Prisma (requête 3).
   - *Recommandation* : Effectuer l'opération en 1 seule requête via les filtres relationnels Prisma :
     ```typescript
     await this.prisma.healthEvent.findFirstOrThrow({
       where: { id, animal: { id: animalId, ownerId } },
     });
     ```

5. **Absence de pagination** :
   - `GET /animals` et `GET /animals/:id/events` renvoient l'intégralité des enregistrements sans limite ni curseur.

---

### Couverture de Tests API

- **État actuel** : **3 suites de tests, 5 tests passants** (`animals.service.spec.ts`, `health-events.service.spec.ts`, `app.controller.spec.ts`).
- **Composants critiques non testés** :
  - `auth.service.ts` : **0 test** (inscription, login, rotation refresh token, brute-force OTP, reset password).
  - `jwt-auth.guard.ts` : **0 test**.
  - `reminders.service.ts` : **0 test** (sélection des dates J-15 / J-1, découpage en lots Expo push).
  - `export.service.ts` : **0 test**.
  - `extraction.service.ts` : **0 test**.
  - `supabase-storage.service.ts` : **0 test**.

---

## 4. Audit du Frontend Mobile (`app/`)

### Points forts Mobile
1. **Architecture Expo Router moderne** :
   - Routage basé sur les fichiers avec groupes de routes `(app)` protégés.
   - Activation du React Compiler (`reactCompiler: true`).
2. **Design System rigoureux & cohérent** :
   - Implémentation fidèle des principes Trade Republic (palette monochrome, typographie SF Pro avec `tabular-nums` pour les compteurs et dates, `Metric`, `Section`, `ListRow` avec filets de 1px).
3. **Qualité exceptionnelle des tests de composants UI** :
   - **23 suites de tests, 106 tests unitaires passants** couvrant les badges, boutons, cartes, champs de formulaire, icônes, segmented controls, et tokens.
4. **Validation formulaire robuste** :
   - Intégration `react-hook-form` couplée à `zod`.

---

### UI / UX & État de la Refonte

Selon le document `plan-ux-ui.md` :
- **Lots L0, L1, L2, L3 terminés** :
  - Tokens et composants primitifs en place.
  - Écran `Aujourd'hui` opérationnel avec le composant héro `Metric` (compteur J-xx) et la liste des échéances tous animaux confondus.
  - Onglets renommés en français ("Aujourd'hui", "Animaux", "Réglages").
- **Lots L4, L5, L6 non achevés** :
  - **Fiche animal (`animals/[id]/index.tsx`)** : L'écran mélange encore le formulaire d'édition permanent en haut de page, les actions critiques au milieu, et la timeline en bas. L'écran dédié `edit.tsx` (Lot L4) n'a pas encore été créé.
  - **Timeline non groupée** : Les événements ne sont pas encore scindés entre "À venir" et "Historique annuel".

---

### Gestion Réseau & Résilience

1. **Race Condition sur le rafraîchissement de token (`api.ts`)** :
   - Lorsque deux requêtes simultanées reçoivent un code 401 (par exemple lors du chargement simultané des animaux et des échéances sur l'écran d'accueil), `tryRefresh()` est exécuté deux fois en parallèle.
   - L'API appliquant la **rotation** du refresh token, la première requête réussit et invalide l'ancien token ; la seconde requête échoue avec un token révoqué, déclenche `clearTokens()` et **déconnecte l'utilisateur arbitrairement**.
   - *Correctif nécessaire* : Implémenter un verrou ou partager la promesse `refreshPromise` dans `api.ts`.

2. **Perte du token push en mémoire (`notifications.ts`)** :
   - `registeredToken` est stocké dans une variable en mémoire (`let registeredToken: string | null = null;`).
   - Si l'utilisateur quitte l'application puis se déconnecte lors d'une session ultérieure, `unregisterPushNotifications()` trouve `registeredToken === null` et ne peut pas notifier l'API pour supprimer le token.
   - *Correctif* : Persister le token push dans `SecureStore` ou `AsyncStorage`.

3. **Absence de cache hors-ligne** :
   - Aucun cache local (TanStack Query / MMKV / SQLite).
   - En cas d'absence de réseau (ex: clinique vétérinaire en sous-sol), l'application ne peut afficher aucun carnet de santé, ce qui nuit à l'usage premier du produit.

4. **Appel réseau superflu dans `export.ts`** :
   - Pour rafraîchir le token avant un téléchargement de fichier, `exportAndShareHealthRecord` appelle `await api.getAnimal(animalId);`.
   - Une méthode dédiée `getValidAccessToken()` évitant un aller-retour réseau inutile serait plus propre.

---

### Configuration Store & Natif

L'inspection de `app/app.json` révèle plusieurs configurations par défaut non adaptées à une soumission Store :
1. **Nom et Identifiants** :
   - `"name": "app"` → doit être `"my-pets"` ou `"MyPets"`.
   - `"slug": "app"` → doit être `"my-pets"`.
   - `"bundleIdentifier": "com.ysma.app"` → doit être `"com.ysma.mypets"`.
2. **Permissions manquantes (Rejet Store garanti sans celles-ci)** :
   - Manque `infoPlist.NSCameraUsageDescription` (obligatoire pour l'usage de la caméra lors de la prise de photo de profil ou du scan).
   - Manque `infoPlist.NSPhotoLibraryUsageDescription` (obligatoire pour la sélection dans la galerie).
   - Le plugin `expo-image-picker` doit être déclaré dans `plugins` avec ses textes de consentement personnalisés en français.
3. **Plugin Notifications absent** :
   - Le plugin `"expo-notifications"` n'apparaît pas dans la liste `plugins` d'`app.json`.
4. **Projet EAS** :
   - La clé `extra.eas.projectId` n'est pas encore renseignée, ce qui désactive les notifications push sur build réel.

---

### Couverture de Tests Mobile

- **Unitaires UI** : 106 tests passants sur les composants primitifs.
- **Manques** :
  - Aucun test d'intégration sur les flux de navigation (SignIn → Dashboard → Fiche animal).
  - Aucun test sur la machine à états de `auth-context.tsx`.
  - Des warnings React 19 / Act apparaissent dans les tests `form-field.test.tsx` (`The current testing environment is not configured to support act(...)`).

---

## 5. Audit DevOps, CI/CD & Environnements

1. **Absence de pipeline CI/CD** :
   - Aucun workflow GitHub Actions dans le dépôt pour valider les PRs (lint, typecheck, tests unitaires).
   - Risque de régression silencieuse lors des développements solo.
2. **Gestion des variables d'environnement** :
   - Aucun fichier `.env.example` dans `api/` ni dans `app/`.
   - Les développeurs ou nouveaux environnements doivent déduire les variables requises depuis le code ou la documentation.
3. **Conteneurisation API** :
   - Aucun `Dockerfile` pour figer l'environnement d'exécution de l'API NestJS. Même si Railway supporte Nixpacks, un Dockerfile multi-stage garantit la reproductibilité en local et sur tout hébergeur (Render, Fly.io, VPS).
4. **Alerte Linter dans `api/src/main.ts`** :
   - `Promises must be awaited, end with a call to .catch ... @typescript-eslint/no-floating-promises` sur l'appel `bootstrap()`.

---

## 6. Matrice des Risques & Vulnérabilités

| Risque / Vulnérabilité | Sévérité | Impact | Effort de correction |
|---|---|---|---|
| **Absence de Rate Limiting sur `/auth/*`** | **Élevée** | Brute force, abus Resend, DoS | Faible (1/2 journée) |
| **Upload sans restriction MIME / Sanitization** | **Élevée** | Stockage de fichiers malveillants | Faible (1/2 journée) |
| **Race condition sur le rafraîchissement de token mobile** | **Élevée** | Déconnexions intempestives des utilisateurs | Faible (2 heures) |
| **Permissions manquantes dans `app.json`** | **Élevée** | Rejet automatique App Store & Play Store | Très faible (1 heure) |
| **Nom de modèle Claude erroné (`claude-opus-4-8`)** | **Moyenne** | Échec de l'extraction IA dès sa réactivation | Très faible (15 min) |
| **Cron rappels sans verrou distribué** | **Moyenne** | Notifications envoyées en double si multi-instances | Moyen (1 jour) |
| **Couverture de tests insuffisante sur l'API (Auth, Cron)** | **Moyenne** | Régressions sur les flux critiques | Moyen (2 jours) |
| **Fiche animal non finalisée (Lot L4 UX)** | **Moyenne** | Ergonomie dégradée sur la consultation | Moyen (1 jour) |
| **Absence de CI/CD et de `.env.example`** | **Faible** | Dette technique, onboarding difficile | Faible (1/2 journée) |

---

## 7. Plan d'Action Recommandé (Priorisation)

### 🔴 Phase P0 — Correctifs de Sécurité & Stabilité Immédiats (1 à 2 jours)
1. **Sécuriser l'API** :
   - Installer et configurer `@nestjs/throttler` sur les routes d'authentification.
   - Ajouter `helmet` et restreindre les origines CORS.
   - Ajouter `@MaxLength(128)` sur les DTOs de mots de passe.
   - Sécuriser l'upload de photo avec un `FileTypeValidator` (`image/jpeg`, `image/png`, `image/webp`).
2. **Corriger le client API Mobile** :
   - Implémenter un verrou sur `tryRefresh()` dans `app/src/lib/api.ts` pour éviter les déconnexions lors de 401 simultanés.
   - Corriger la persistance de `registeredToken` dans `notifications.ts`.
3. **Corriger le modèle IA** :
   - Remplacer `claude-opus-4-8` par `claude-3-5-sonnet-20241022` dans `extraction.service.ts`.

### 🟡 Phase P1 — Conformité Stores & Finalisation UX (2 à 3 jours)
1. **Configuration Store (`app.json`)** :
   - Renommer le projet en `"MyPets"`, `bundleIdentifier: "com.ysma.mypets"`.
   - Ajouter les déclarations de permissions iOS (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`).
   - Ajouter le plugin `expo-notifications`.
2. **Achever le Lot L4 du plan UX/UI** :
   - Créer `app/src/app/(app)/animals/[id]/edit.tsx` pour isoler le formulaire d'édition et l'action de suppression.
   - Transformer `animals/[id]/index.tsx` en écran de pure consultation avec timeline groupée ("À venir" et par année).

### 🟢 Phase P2 — Qualité, DevOps & Préparation Production (2 à 3 jours)
1. **Tests unitaires API** :
   - Rédiger les tests unitaires pour `auth.service.ts` et `reminders.service.ts`.
2. **Industrialisation DevOps** :
   - Créer `.github/workflows/ci.yml` exécutant le lint, le typecheck et les tests unitaires sur `api` et `app`.
   - Créer `api/.env.example` et `app/.env.example`.
   - Ajouter un `Dockerfile` pour l'API.
3. **Résilience hors-ligne (V2 MVP)** :
   - Évaluer la mise en place d'un cache local (ex: TanStack Query avec AsyncStorage) pour consulter les carnets sans réseau.
