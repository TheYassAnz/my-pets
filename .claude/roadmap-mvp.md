# Roadmap de développement — MVP carnet de santé numérique pour animaux

Roadmap pensée pour un développement solo à temps partiel (soirs/weekends), en parallèle d'une activité principale (alternance, M2).

**Durée totale estimée : ~16-20 semaines (4-5 mois)** selon le rythme réel disponible. Le passage à une API custom (NestJS + Prisma + auth JWT maison) ajoute du travail par rapport à un backend-as-a-service, mais offre un contrôle total sur la logique métier.

> **Pivot PWA (2026-11-09)** : l'application n'est plus une app mobile iOS/Android mais une **application web PWA** (front Expo exporté en web, servi par Vercel avec proxy /api vers Render depuis le 2026-11-10). Travail sur la branche `feat/pwa` des dépôts `api/` et `app/` ; plan : `docs/superpowers/plans/2026-11-09-refonte-pwa.md`. Conséquences sur les phases ci-dessous : le périmètre est réduit aux 5 écrans MVP (routines, documents et foyer supprimés) ; Phase 1 → refresh token en cookie httpOnly, access token en mémoire ; Phase 5 → Web Push (VAPID) + email quotidien (Resend) à la place d'Expo Notifications, plus besoin d'EAS ; Phase 7 → plus de soumission aux stores, déploiement de l'API sur Render, PWA sur Vercel. Restent à écrire : plan 2 (mise en page desktop, maquettes d'abord) et plan 3 (vrai foyer multi-utilisateurs, spec d'abord). Mise en production en attente : clés VAPID, `npm run build:web`, sauvegarde de la base puis `prisma migrate deploy`, passe navigateur connectée.

> **État d'avancement (2026-07-18, avant le pivot PWA)** : Phases 0 à 6 terminées côté code. **Extraction IA temporairement désactivée** (décision 2026-07-18) : endpoint répond 503 sans `ANTHROPIC_API_KEY`, UI scan masquée derrière `AI_EXTRACTION_ENABLED = false` dans `app/src/lib/features.ts` — réactivation = clé + flag à true. Restent en attente de setup manuel : variables d'environnement Railway (Phase 1), clé API Resend + domaine vérifié (Phase 1), bucket Supabase Storage + clé service-role (Phase 2), clé `ANTHROPIC_API_KEY` (Phase 4) et projet EAS (`extra.eas.projectId` dans app.json) + development build pour les push (Phase 5). Prochaine étape : Phase 7 (beta, monitoring, soumission stores) — actions manuelles hors code.

## Phase 0 — Fondations (2-3 semaines) ✅

- Initialisation du projet Expo (TypeScript dès le départ)
- Initialisation du projet API NestJS (TypeScript, structure modulaire de base)
- Setup Prisma + connexion à une base PostgreSQL (Supabase, usage DB uniquement)
- Premier schéma de données de base (utilisateurs, animaux)
- Configuration de la navigation mobile (React Navigation), thème de base
- Premier déploiement "hello world" : API accessible en ligne (Railway/Render/Fly.io) + app mobile qui l'appelle via Expo Go

## Phase 1 — Authentification JWT custom (2 semaines) ✅

- Endpoints API : inscription, connexion, refresh token
- Hash sécurisé des mots de passe (bcrypt ou argon2)
- Génération et validation des JWT, guards NestJS pour protéger les routes
- Écrans mobile : inscription/connexion, stockage sécurisé du token côté client
- Mot de passe oublié : code OTP à 6 chiffres envoyé par email (Resend), écrans mobile dédiés ✅
- (OAuth Google/Apple repoussé en V2 si nécessaire — complexité supplémentaire avec un auth maison)

**Jalon** : un utilisateur peut créer un compte et rester connecté de façon sécurisée.

## Phase 2 — Gestion des animaux (2 semaines) ✅

- CRUD fiche animal côté API (modules NestJS, DTOs de validation)
- Upload de photo de profil animal vers le stockage objet (S3-compatible)
- Écrans mobile : créer, lister, modifier, supprimer un animal

**Jalon** : un utilisateur connecté peut gérer plusieurs animaux de bout en bout.

## Phase 3 — Événements santé manuels (2-3 semaines) ✅

- Modèle de données Prisma pour vaccins / traitements / visites (types et champs différenciés)
- Endpoints CRUD correspondants côté API
- Formulaires de saisie manuelle côté mobile
- Liste chronologique par animal (timeline)

**Jalon** : le carnet de santé "basique" fonctionne de bout en bout, sans IA.

## Phase 4 — Extraction IA (2-3 semaines) ✅

- Intégration caméra (Expo Camera) côté mobile
- Endpoint API qui reçoit la photo, l'envoie à Claude (vision), et retourne le JSON structuré
- UI de validation/correction avant sauvegarde (étape obligatoire — ne jamais faire confiance à 100% à l'extraction automatique)

**Jalon** : le différenciateur fort du produit est fonctionnel.

## Phase 5 — Notifications (2 semaines) ✅

- Cron job interne à l'API (`@nestjs/schedule`) qui scanne les échéances à venir
- Intégration Expo Notifications côté mobile + gestion des permissions
- Logique de rappel configurable selon le type de produit (ex. J-15, J-1)

**Jalon** : l'app a une utilité récurrente, pas seulement un outil de saisie ponctuelle.

## Phase 6 — Export PDF + finitions (1-2 semaines) ✅

- Génération PDF du carnet complet côté API (utile pour un nouveau vétérinaire, une pension, un voyage)
- Passes UI/UX : cohérence visuelle, gestion des erreurs, états de chargement
- Onboarding simple pour les nouveaux utilisateurs

## Phase 7 — Tests et lancement (2-3 semaines, compressible)

- Recrutement de 5-10 beta testeurs (entourage propriétaires d'animaux, groupes Facebook de niche)
- Itération sur les retours utilisateurs
- Monitoring/logs de base sur l'API en production (essentiel avec une infra custom à maintenir)
- ~~Préparation des assets stores et soumission App Store / Play Store~~ → remplacé par le déploiement de la PWA (API Railway servant le front, icônes PWA, test d'installation sur iOS et Android)

## Conseil stratégique

Ne pas sous-estimer la Phase 7 : beaucoup de side projects solo meurent juste avant le lancement par excès de peaufinage. Fixer une date de soumission aux stores dès la Phase 0, même approximative, pour structurer l'ensemble du planning.

Avec une API et un auth custom, la charge de maintenance est plus élevée qu'avec un BaaS — prévoir du temps récurrent post-lancement pour le monitoring, les mises à jour de sécurité et les migrations de schéma.

## Fonctionnalités repoussées après le MVP

- OAuth Google/Apple (si non inclus en Phase 1)
- Partage du carnet avec vétérinaire/pet-sitter
- Multi-utilisateurs sur un même animal (foyers séparés)
- Suivi du poids en courbe/graphique
- Partenariats B2B vétérinaires
- Modèle d'abonnement payant
