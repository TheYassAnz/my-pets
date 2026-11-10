# Front sur Vercel, API seule sur Render — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Servir la PWA depuis Vercel ; l'API NestJS sur Render ne sert plus que `/api`.

**Architecture:** Vercel construit `app/` depuis GitHub (`expo export -p web`) et sert `dist/`. Une règle de réécriture Vercel relaie `/api/*` vers Render, sans redirection visible : pour le navigateur, tout reste sur le même domaine (`*.vercel.app`). Le cookie `mypets_rt` (`SameSite=Strict`, chemin `/api/auth`), l'URL relative `/api` du front et l'absence de CORS en production restent donc inchangés. Côté API, `ServeStaticModule`, `api/client/` et le script `deploy:web` disparaissent.

**Tech Stack:** Expo SDK 56 (web export `output: "single"`), Vercel (`vercel.json` : rewrites, headers), NestJS 11, Render.

**Spec:** Pas de document séparé. Décisions validées par Yassine le 2026-11-10 :
- liaison par proxy Vercel (rewrite `/api/*` → Render), pas d'appels cross-origin ;
- suppression complète du service du front par l'API (`api/client`, `ServeStaticModule`, `deploy:web`) ;
- build Vercel depuis GitHub, dossier racine `app/`, déploiement auto sur `main` et aperçu par PR ;
- domaine gratuit `*.vercel.app`.

## Global Constraints

- Branche : `feat/vercel`, créée depuis `origin/main` (`e47e022`, PR #2 fusionnée).
- URL Render cible du proxy : `https://my-pets.onrender.com`. Si Render a attribué une autre URL au service, Yassine la donne avant la Task 1 et elle remplace celle-ci partout.
- Le front appelle toujours `EXPO_PUBLIC_API_URL=/api`. Cette valeur est fixée dans le script de build, jamais dans le tableau de bord Vercel.
- `EXPO_PUBLIC_VAPID_PUBLIC_KEY` est fournie au build par une variable d'environnement Vercel. Le build échoue si elle manque (garde actuelle de `deploy-web.sh` conservée).
- Aucun fichier de `refresh-cookie.ts`, `api.ts` ni du CORS ne change : le proxy rend ces changements inutiles.
- Aucune migration Prisma. Ne jamais afficher ni committer le contenu des `.env`. Rien n'est poussé sans l'accord de Yassine.
- Ordre de mise en ligne : le projet Vercel existe et l'aperçu de la PR fonctionne **avant** la fusion. Sinon, la fusion redéploie Render sans front et la production n'a plus d'interface.
- Fin de chaque message de commit : `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Rechargement sur une URL profonde (`/animals/123/events/new`) → Vercel renvoie `index.html`, pas une 404. Test en Task 1.
2. `/api/...` n'est jamais intercepté par le repli SPA : la règle `/api/:path*` précède le repli `/(.*)`. Test en Task 1.
3. `sw.js`, `index.html` et `manifest.json` sont revalidés à chaque visite (`no-cache`), comme le faisait l'API. Sinon, un ancien service worker reste bloqué chez les utilisateurs. Test en Task 1.
4. Après rechargement de la page, la session est restaurée : le cookie de refresh passe par le proxy. Vérifié à la main en Task 3.
5. Render endormi : le premier appel via le proxy peut dépasser le délai d'attente d'une réécriture externe Vercel. Vérifié à la main en Task 3. S'il échoue, on le note comme suite à traiter (nouvel essai côté `api.ts` ou ping de réveil) ; ce n'est pas corrigé dans ce plan.

---

### Task 1: Build et configuration Vercel du front

**Files:**
- Rename: `app/scripts/deploy-web.sh` → `app/scripts/build-web.sh`
- Modify: `app/package.json` (script `deploy:web` → `build:web`)
- Create: `app/vercel.json`
- Test: `app/src/__tests__/vercel-config.test.ts`

**Interfaces:**
- Produces: `npm run build:web` (dans `app/`) écrit l'export web dans `app/dist/` et ne touche plus `../api/client`. `app/vercel.json` est lu par Vercel avec le dossier racine `app/`.

- [ ] **Step 1: Write the failing test** `vercel-config.test.ts`, qui charge `../../vercel.json` :
  - `buildCommand === 'npm run build:web'` et `outputDirectory === 'dist'` ;
  - `rewrites[0]` vaut `{ source: '/api/:path*', destination: 'https://my-pets.onrender.com/api/:path*' }` ;
  - la dernière réécriture vaut `{ source: '/(.*)', destination: '/index.html' }`, et aucune autre réécriture n'a `/(.*)` pour source ;
  - pour chaque chemin `/sw.js`, `/index.html`, `/manifest.json` et `/`, une entrée de `headers` dont `source` égale ce chemin contient `{ key: 'Cache-Control', value: 'no-cache' }` ;
  - une entrée `headers` de source `/_expo/static/(.*)` contient `{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }`.
- [ ] **Step 2: Run** `cd app && npx jest src/__tests__/vercel-config.test.ts`. Expected: FAIL, « Cannot find module '../../vercel.json' ».
- [ ] **Step 3: Create `app/vercel.json`** avec exactement ces clés : `"$schema": "https://openapi.vercel.sh/vercel.json"`, `"framework": null`, `buildCommand`, `outputDirectory`, `rewrites` et `headers`, comme le test les fige. Vercel sert les fichiers existants (`sw.js`, `_expo/…`) avant d'appliquer les réécritures : le repli `/(.*)` ne touche donc que les routes de l'app.
- [ ] **Step 4: `git mv` le script** vers `build-web.sh`. Supprimer les trois dernières lignes (le `find ../api/client … -delete`, le `cp` et leur commentaire) et mettre à jour le commentaire d'en-tête : « Exporte la PWA dans dist/ (build Vercel) ». Dans `package.json`, remplacer `"deploy:web": "bash scripts/deploy-web.sh"` par `"build:web": "bash scripts/build-web.sh"`.
- [ ] **Step 5: Run** `cd app && npx jest src/__tests__/vercel-config.test.ts && npm run build:web && ls dist/index.html dist/sw.js`. Expected: PASS, puis les deux fichiers listés. La clé VAPID vient de `app/.env`.
- [ ] **Step 6: Run** `cd app && npm test && npm run lint`. Expected: tout vert.
- [ ] **Step 7: Commit** `feat(app): build web et configuration Vercel (proxy /api vers Render)`.

### Task 2: L'API ne sert plus le front

**Files:**
- Modify: `api/src/app.module.ts` : retirer l'import et le bloc `ServeStaticModule.forRoot(...)`, ainsi que les imports `ServerResponse` et `join`, devenus inutiles.
- Delete: `api/src/static.spec.ts`, `api/client/` (tout le dossier, `.gitkeep` compris)
- Modify: `api/package.json` / `api/package-lock.json` : `npm uninstall @nestjs/serve-static`

**Interfaces:**
- Consumes: rien de la Task 1.
- Produces: l'API ne répond plus que sous `/api`. `GET /` renvoie la 404 JSON de Nest. `healthCheckPath: /api` dans `render.yaml` reste valide sans changement.

- [ ] **Step 1: Apply** les trois changements ci-dessus. Vérifier que `grep -rn "CLIENT_DIR\|serve-static\|api/client" api/src api/package.json render.yaml` ne renvoie plus rien.
- [ ] **Step 2: Run** `cd api && npm run build && npm test && npm run lint`. Expected: build OK, tests verts (la suite `PWA statique` a disparu), lint propre.
- [ ] **Step 3: Commit** `refactor(api): ne plus servir la PWA (front sur Vercel)`.

### Task 3: Documentation et mise en ligne (Yassine, manuel)

**Files:**
- Modify: `CLAUDE.md` :
  - pivot et hébergement : front sur Vercel, proxy `/api` ;
  - schéma d'architecture : remplacer « serves the built front from api/client » par un bloc Vercel au-dessus de l'API ;
  - layout : retirer `client/` ;
  - commandes : `npm run build:web` ; `EXPO_PUBLIC_API_URL` n'est plus forcé par `deploy:web` mais par `build:web`.
- Modify: `.claude/roadmap-mvp.md:7` : une phrase « front servi par Vercel (proxy /api vers Render) depuis le 2026-11-10 ».

- [ ] **Step 1: Apply** les deux modifications de doc. Run `grep -rn "deploy:web\|api/client" CLAUDE.md .claude/roadmap-mvp.md`. Expected: aucune ligne.
- [ ] **Step 2: Commit** `docs: front sur Vercel, API seule sur Render`.
- [ ] **Step 3 (Yassine):** pousser `feat/vercel` et ouvrir la PR (sur accord).
- [ ] **Step 4 (Yassine):** sur vercel.com :
  - New Project ;
  - importer le dépôt `my-pets`, Root Directory `app` ;
  - ajouter la variable `EXPO_PUBLIC_VAPID_PUBLIC_KEY` (la clé publique de `app/.env`) pour Production et Preview ;
  - déployer. L'aperçu de la PR se construit.
- [ ] **Step 5 (Yassine), sur l'URL d'aperçu** :
  1. inscription puis connexion ;
  2. ajout d'un animal ;
  3. rechargement de `/animals/<id>` : la page s'affiche et la session est toujours ouverte (Review Focus 1 et 4) ;
  4. dans DevTools > Network, les appels `/api/...` sont en 200 sur le domaine Vercel, sans erreur CORS ;
  5. dans DevTools > Application, `sw.js` est actif.
- [ ] **Step 6 (Yassine), après au moins 15 min d'inactivité de Render** : ouvrir l'aperçu et se connecter. Noter si le premier appel échoue (Review Focus 5).
- [ ] **Step 7 (Yassine):** fusionner la PR. Vercel déploie en production, Render redéploie l'API sans front. Ensuite :
  - vérifier `https://<projet>.vercel.app` ;
  - vérifier que `https://my-pets.onrender.com/api` renvoie `{status:'ok'}` ;
  - partager désormais l'URL Vercel.
