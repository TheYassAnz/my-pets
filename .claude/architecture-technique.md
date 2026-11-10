# Architecture technique — Carnet de santé numérique pour animaux

## Vue d'ensemble

Application mobile cross-platform permettant aux propriétaires d'animaux de tenir un carnet de santé numérique, avec extraction automatique des données depuis des photos d'ordonnances/carnets papier via IA, et rappels intelligents pour les échéances de santé. L'application repose sur une **API métier custom**, plutôt que sur un backend-as-a-service, pour garder le contrôle total sur la logique applicative.

## Stack technique retenue

### Mobile — React Native avec Expo

- Cross-platform iOS + Android depuis une seule codebase
- Expo simplifie la gestion de la caméra, des notifications push, et le build/déploiement sur les stores sans configuration native lourde (Xcode/Android Studio) au démarrage
- Capitalise sur l'expérience React/Next.js existante (hooks, composants, patterns proches)

### API — NestJS + Prisma

- **NestJS** : architecture modulaire imposée (modules, controllers, services, DTOs), évite le code spaghetti à mesure que l'API grossit — précieux en solo sans relecture externe
- **TypeScript natif**, validation de payloads intégrée (class-validator) — sécurise les endpoints recevant du JSON extrait par l'IA
- Concepts proches d'Angular (decorators, injection de dépendances) déjà connus, donc montée en compétence facilitée
- **Prisma** comme ORM : migrations propres, types générés automatiquement à partir du schéma — utile pour itérer rapidement sur le modèle de données en début de projet

### Authentification — JWT custom

- Implémentation maison (inscription, connexion, hash des mots de passe, génération/validation de JWT, refresh tokens)
- Guards NestJS pour protéger les routes selon l'utilisateur authentifié
- Plus de travail initial qu'un service externe, mais contrôle total sur la logique de sécurité et aucune dépendance à un fournisseur tiers

### Base de données — PostgreSQL (Supabase, usage DB uniquement)

- **Supabase utilisé uniquement comme infrastructure gérée (Postgres + Storage)** — pas son BaaS (pas d'Auth Supabase, pas de RLS Supabase, pas de supabase-js côté mobile)
- SQL relationnel classique, adapté aux requêtes type "tous les vaccins d'un animal"
- Accès à la base exclusivement via l'API NestJS (Prisma) — le mobile ne communique jamais directement avec la base

### Stockage de fichiers — Supabase Storage

- Photos d'ordonnances et photos d'animaux stockées sur **Supabase Storage** (bucket dédié, ex. photos de profil animal)
- L'API NestJS gère l'upload/download via `@supabase/supabase-js` avec la **clé service-role, côté serveur uniquement** — jamais d'accès direct depuis le mobile vers le stockage

### Hébergement API — PaaS (Railway / Render / Fly.io)

- NestJS nécessite un process Node persistant (serveur long-running), incompatible avec le modèle serverless de Vercel
- Un PaaS type Railway, Render ou Fly.io permet de déployer l'API NestJS nativement, avec gestion simplifiée du déploiement continu, sans configurer un VPS à la main
- Alternative possible plus tard : VPS Docker (Hetzner/OVH) si besoin de plus de contrôle ou de réduction de coûts à l'échelle — l'expérience Docker/K8s existante reste valorisable pour cette migration future

### Extraction IA — Claude API (vision)

- Photo d'une ordonnance ou d'un carnet papier envoyée à l'API NestJS, qui relaie l'appel à l'API Claude
- Réponse demandée en JSON structuré (date, produit, posologie, vétérinaire)
- Coût à surveiller à l'échelle, mais raisonnable pour un MVP
- **Principe non négociable** : l'extraction pré-remplit un formulaire, mais l'utilisateur valide toujours avant sauvegarde — jamais d'auto-save sans confirmation humaine

### Notifications push — Expo Notifications

- Cron job côté API NestJS (ex. via `@nestjs/schedule`) qui scanne quotidiennement les échéances de vaccins/traitements à venir
- Déclenchement de notifications selon des délais configurables par type de produit (ex. J-15, J-1)

## Schéma de flux

1. L'**app mobile** envoie toutes ses requêtes à l'**API NestJS** (jamais directement à la base ou au stockage)
2. L'API NestJS gère l'authentification (JWT), le CRUD (animaux, événements santé), l'upload de fichiers vers le stockage objet, et les appels à Claude
3. Lors de la capture d'une **photo d'ordonnance** : upload vers le stockage objet via l'API → l'API relaie la photo à **Claude (vision)** → retour JSON structuré → pré-remplissage du formulaire côté mobile → validation utilisateur → sauvegarde en base via l'API
4. Un **cron job interne à l'API** (NestJS Schedule) vérifie chaque jour les échéances de vaccins/traitements et déclenche les notifications via **Expo Notifications**

```
App mobile (React Native + Expo)
        │
        ▼
   API NestJS (Auth JWT, logique métier)
        │
   ┌────┼──────────────┐
   │    │              │
   ▼    ▼              ▼
PostgreSQL   Supabase Storage  Claude API (vision)
(Supabase,   (photos, PDF)     → extraction JSON
 via Prisma)      │
                  ▼
          (données validées par l'utilisateur,
           puis sauvegardées via l'API)

API NestJS (cron interne, rappels)
        │
        ▼
Expo Notifications (push)
```

## Choix structurants et justification

| Décision                                         | Alternative écartée                              | Raison                                                                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile natif cross-platform (Expo)               | PWA web responsive                               | Présence sur les stores = crédibilité et découvrabilité pour un projet à ambition business ; notifications natives plus fiables                                     |
| API custom NestJS + Prisma                       | Backend-as-a-Service (Supabase complet)          | Contrôle total sur la logique métier (validation des extractions IA, règles de rappel, évolutivité) ; pas de dépendance à un BaaS pour la logique applicative       |
| Auth JWT custom                                  | Service d'auth externe (Supabase Auth, Auth0...) | Contrôle total sur la sécurité et la logique d'authentification, aucune dépendance tierce                                                                           |
| Supabase en DB PostgreSQL + Storage gérés        | Self-host PostgreSQL / stockage S3 tiers         | Démarrage plus rapide qu'un self-host complet ; un seul fournisseur infra (DB + Storage), piloté uniquement par l'API                                               |
| Hébergement API sur PaaS (Railway/Render/Fly.io) | Vercel                                           | Vercel est serverless et ne convient pas à un serveur NestJS persistant ni à l'hébergement de PostgreSQL ; un PaaS supporte nativement un process Node long-running |
| Claude API vision dès le MVP                     | Saisie manuelle uniquement en V1                 | Différenciateur fort vs concurrents existants (Pawprint, 11pets, PetDesk) qui reposent sur la saisie manuelle                                                       |

## Risques techniques à anticiper

- **RGPD** : données de santé animale moins sensibles légalement que la santé humaine, mais rigueur nécessaire si stockage de photos contenant des informations identifiantes (nom du cabinet vétérinaire, tarifs)
- **Sécurité de l'auth custom** : implémentation JWT maison à soigner particulièrement (hash des mots de passe avec bcrypt/argon2, expiration et rotation des refresh tokens, protection contre le brute-force)
- **Fiabilité de l'extraction IA** : toujours prévoir une étape de validation/correction manuelle, ne jamais sauvegarder automatiquement
- **Coût Claude API à l'échelle** : à modéliser dans le pricing si usage intensif de la vision
- **Charge opérationnelle accrue** : développer sa propre API et son auth demande plus de maintenance qu'un BaaS (mises à jour de sécurité, monitoring, gestion des migrations Prisma)

## Fonctionnalités explicitement exclues du MVP (V2+)

- Partage du carnet avec vétérinaire/pet-sitter (gestion de droits, complexité RGPD)
- Multi-utilisateurs sur un même animal (foyers séparés)
- Suivi du poids en courbe/graphique
- Partenariats B2B vétérinaires
- Abonnement payant (valider gratuitement d'abord, monétiser après traction)
