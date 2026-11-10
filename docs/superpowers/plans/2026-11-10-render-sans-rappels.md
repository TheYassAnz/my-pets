# Migration Render + rappels coupés — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Héberger l'API (qui sert aussi la PWA) sur l'offre gratuite de Render à la place de Railway, avec les rappels quotidiens coupés par défaut.

**Architecture:** Un Blueprint `render.yaml` à la racine du dépôt décrit un unique Web Service gratuit (`rootDir: api`). Le cron de 8 h reste dans le code mais ne fait rien tant que `REMINDERS_ENABLED` ne vaut pas `"true"`. Côté front, un drapeau `REMINDERS_ENABLED = false` dans `app/src/lib/features.ts` masque l'invite « Activer les rappels ».

**Tech Stack:** NestJS 11, `@nestjs/schedule`, Prisma 5, Render Blueprint, Expo web export.

**Spec:** Pas de document séparé. Décisions validées par Yassine le 2026-11-10 :
- remplacer Railway (payant) par Render (gratuit) ;
- désactiver les rappels par une variable d'environnement (réactivables sans changer de code) ;
- masquer l'invite de rappels côté front ;
- configuration Render versionnée dans un `render.yaml`, et suppression de `railway.json`.

## Global Constraints

- Variable d'environnement exacte : `REMINDERS_ENABLED`. Seule la valeur `"true"` active les rappels ; absente ou toute autre valeur = coupé.
- Drapeau front exact : `export const REMINDERS_ENABLED = false;` dans `app/src/lib/features.ts`, sur le modèle de `AI_EXTRACTION_ENABLED`.
- Render : `plan: free`, `region: frankfurt` (plus proche du pooler Supabase eu-west-1), `rootDir: api`, `healthCheckPath: /api`.
- Les secrets ne sont jamais écrits dans `render.yaml` : `sync: false` pour chacun. Ne jamais afficher ni committer le contenu des `.env`.
- Aucune migration Prisma n'est lancée dans ce plan (base Supabase réelle) : ni en commande de build, ni de start.
- Rien n'est poussé sans l'accord de Yassine.
- Fin de chaque message de commit : `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Ne pas toucher à la modification non commitée de `app/package.json` / `app/package-lock.json` (passage d'expo à `^58.0.23`, faite hors de ce plan) : ne jamais la stager.

## Review Focus

1. `REMINDERS_ENABLED="false"`, `"TRUE"`, `"1"` ou chaîne vide → rappels coupés (seul `"true"` exact les active). Test en Task 1.
2. Rappels coupés → aucune requête Prisma, aucun email, aucun push (pas seulement « pas d'envoi » : pas de lecture de base inutile au réveil). Test en Task 1.
3. Drapeau front à `false` → l'écran « Mes animaux » s'affiche normalement sans le bouton « Activer les rappels », et sans ré-abonnement silencieux. Test en Task 2.
4. Le cookie de refresh doit rester `Secure` en production : `NODE_ENV=production` doit figurer dans `render.yaml`. Vérifié en Task 3.
5. Service endormi : le premier appel attend ~1 min. Le service worker ne doit pas mettre en cache une erreur de réveil ; il ne met jamais `/api/` en cache (déjà le cas), rien à changer. Vérifié à la main en Task 4.

---

### Task 1: Interrupteur `REMINDERS_ENABLED` côté API

**Files:**
- Modify: `api/src/notifications/reminders.service.ts`
- Test: `api/src/notifications/reminders.service.spec.ts`

**Interfaces:**
- Produces: `RemindersService.runDaily(): Promise<void>` porte `@Cron('0 8 * * *')` ; `sendDueReminders()` perd son décorateur et garde exactement son comportement (les tests existants ne changent pas).

- [ ] **Step 1: Write the failing tests** dans un nouveau `describe('runDaily')` du spec existant (réutiliser les fabriques `make`/`owner`/`event` du fichier) :

```ts
afterEach(() => { delete process.env.REMINDERS_ENABLED; });

it('ne fait rien quand REMINDERS_ENABLED est absent', async () => {
  const service = make();
  const spy = jest.spyOn(service, 'sendDueReminders');
  await service.runDaily();
  expect(spy).not.toHaveBeenCalled();
  expect(prisma.healthEvent.findMany).not.toHaveBeenCalled();
});

it.each(['false', 'TRUE', '1', ''])('ne fait rien quand REMINDERS_ENABLED=%p', async (v) => {
  process.env.REMINDERS_ENABLED = v;
  const service = make();
  const spy = jest.spyOn(service, 'sendDueReminders');
  await service.runDaily();
  expect(spy).not.toHaveBeenCalled();
});

it('envoie les rappels quand REMINDERS_ENABLED=true', async () => {
  process.env.REMINDERS_ENABLED = 'true';
  const service = make();
  const spy = jest.spyOn(service, 'sendDueReminders').mockResolvedValue();
  await service.runDaily();
  expect(spy).toHaveBeenCalledTimes(1);
});
```

(Imbriquer ce `describe` dans le `describe('RemindersService')` existant pour réutiliser `make`, `prisma` et son `beforeEach`.)

- [ ] **Step 2: Run** `cd api && npx jest src/notifications/reminders.service.spec.ts` — Expected: FAIL, `runDaily is not a function`.

- [ ] **Step 3: Implement** `async runDaily(): Promise<void>` dans `RemindersService` : déplacer `@Cron('0 8 * * *')` de `sendDueReminders` vers `runDaily` ; si `process.env.REMINDERS_ENABLED !== 'true'`, `this.logger.log('Rappels désactivés (REMINDERS_ENABLED)')` puis `return` ; sinon `await this.sendDueReminders()`. Lire la variable à l'appel (pas dans le constructeur) pour que les tests et un changement d'env pris au redémarrage fonctionnent. Mettre à jour le commentaire au-dessus.

- [ ] **Step 4: Run** `cd api && npm test` — Expected: toutes les suites PASS (45 tests existants + les nouveaux).

- [ ] **Step 5: Commit**

```bash
git add api/src/notifications/reminders.service.ts api/src/notifications/reminders.service.spec.ts
git commit -m "feat(api): couper les rappels quotidiens sauf si REMINDERS_ENABLED=true"
```

### Task 2: Masquer l'invite de rappels côté front

**Files:**
- Modify: `app/src/lib/features.ts`
- Modify: `app/src/app/(app)/index.tsx:150`
- Test: `app/src/__tests__/screens/my-animals.test.tsx`
- Regenerate: `api/client/` (via `npm run deploy:web`)

**Interfaces:**
- Produces: `REMINDERS_ENABLED: boolean` exporté par `@/lib/features`.

- [ ] **Step 1: Write the failing test** dans `my-animals.test.tsx` : avec `Notification` défini globalement (`permission: 'default'`) et `PushManager`/`serviceWorker` présents pour que `pushSupported()` soit vrai, rendre l'écran et vérifier `expect(screen.queryByText('Activer les rappels')).toBeNull()` tout en voyant toujours `Mes animaux`.

- [ ] **Step 2: Run** `cd app && npx jest src/__tests__/screens/my-animals.test.tsx` — Expected: FAIL (le bouton est affiché).

- [ ] **Step 3: Implement** : ajouter dans `features.ts` `export const REMINDERS_ENABLED = false;` avec un commentaire d'une ligne (« repasser à true en même temps que REMINDERS_ENABLED=true côté API ») ; dans `index.tsx`, remplacer `<ReminderPrompt />` par `{REMINDERS_ENABLED ? <ReminderPrompt /> : null}`. Ne pas modifier `reminder-prompt.tsx` ni son test (le composant entier, ré-abonnement silencieux compris, n'est plus monté).

- [ ] **Step 4: Run** `cd app && npx tsc --noEmit && npm test` — Expected: aucune erreur TS, toutes les suites PASS.

- [ ] **Step 5: Rebuild the served PWA** : `cd app && npm run deploy:web`. Expected: `api/client/index.html` régénéré, `git status` montre des changements sous `api/client/`.

> Si `deploy:web` échoue à cause de la mise à jour expo non commitée (`^58.0.23`), s'arrêter et le signaler à Yassine plutôt que de toucher à `app/package.json`.

- [ ] **Step 6: Commit**

```bash
git add app/src/lib/features.ts "app/src/app/(app)/index.tsx" app/src/__tests__/screens/my-animals.test.tsx api/client
git commit -m "feat(app): masquer l'invite de rappels tant qu'ils sont coupés"
```

### Task 3: Blueprint Render et retrait de Railway

**Files:**
- Create: `render.yaml` (racine du dépôt)
- Delete: `api/railway.json`
- Modify: `CLAUDE.md` (stack, schéma, variables d'env, phase 7)

**Interfaces:**
- Consumes: `REMINDERS_ENABLED` (Task 1).

- [ ] **Step 1: Write `render.yaml`** avec un unique service :
  - `type: web`, `name: my-pets`, `runtime: node`, `plan: free`, `region: frankfurt`, `rootDir: api` ;
  - `buildCommand: npm ci && npm run build` (pas de `prisma migrate`) ;
  - `startCommand: npm run start:prod` ;
  - `healthCheckPath: /api` ;
  - `autoDeploy: true` sur la branche `main` ;
  - `envVars` en clair : `NODE_ENV=production`, `NODE_VERSION=22`, `REMINDERS_ENABLED=false`, `JWT_ACCESS_TTL`, `REFRESH_TOKEN_TTL_DAYS`, `SUPABASE_ANIMAL_PHOTOS_BUCKET`, `EMAIL_FROM` (reprendre les valeurs non secrètes de `api/.env` sans afficher le fichier : `grep -E '^(JWT_ACCESS_TTL|REFRESH_TOKEN_TTL_DAYS|SUPABASE_ANIMAL_PHOTOS_BUCKET)=' api/.env`, et laisser `EMAIL_FROM` en `sync: false` si la valeur contient une adresse personnelle) ;
  - `envVars` en `sync: false` : `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
  - Pas de `PORT` (Render l'injecte, `main.ts` le lit déjà) ni de `CORS_ORIGIN` (même origine).

- [ ] **Step 2: Verify the build the way Render runs it** : `cd api && rm -rf dist && npm ci && npm run build && test -f dist/main.js && echo OK`. Expected: `OK`.

- [ ] **Step 3: Validate the YAML** : `npx --yes js-yaml render.yaml >/dev/null && echo valid` (ou `ruby -ryaml -e 'YAML.load_file("render.yaml")'`). Expected: `valid`. Puis `grep -n "NODE_ENV" render.yaml` doit afficher `production` (Review Focus 4).

- [ ] **Step 4: Delete `api/railway.json` and update `CLAUDE.md`** : remplacer Railway par Render (offre gratuite, mise en veille après 15 min, réveil ~1 min) dans le tableau Stack, le schéma, la note pivot et la phase 7 ; ajouter `REMINDERS_ENABLED` à la liste des variables API ; noter dans la section Notifications que le cron est coupé tant que `REMINDERS_ENABLED` ≠ `true` et que, sur l'offre gratuite, il ne tournera de toute façon pas si le service dort à 8 h. Ne pas modifier les anciens plans ni `AUDIT.md`/`.claude/*.md` (historique).

- [ ] **Step 5: Commit**

```bash
git add render.yaml api/railway.json CLAUDE.md
git commit -m "chore: déployer sur Render (offre gratuite) à la place de Railway"
```

### Task 4: Mise en ligne (actions de Yassine, guidées)

Pas de code. À faire seulement après accord explicite de Yassine pour chaque point.

- [ ] **Step 1:** Yassine crée le dépôt GitHub vide `my-pets` ; avec son accord : `git remote add origin <url>` puis `git push -u origin main`.
- [ ] **Step 2:** Yassine, dans Render : *New → Blueprint*, sélectionne le dépôt `my-pets`, renseigne chaque variable `sync: false` (mêmes valeurs que sur Railway), valide.
- [ ] **Step 3:** Vérifier le déploiement : `curl -s https://<service>.onrender.com/api` renvoie la réponse du health check, et `https://<service>.onrender.com/` sert la PWA. Après 15 min sans trafic, recharger : la page arrive en ~1 min sans erreur durable (Review Focus 5). Dans les logs Render, aucune ligne `Rappels envoyés` ; à 8 h (si le service est éveillé) : `Rappels désactivés (REMINDERS_ENABLED)`.
- [ ] **Step 4:** Connexion, création d'un animal, export PDF sur l'URL Render (cookie `Secure` accepté en HTTPS).
- [ ] **Step 5:** Yassine supprime le service Railway une fois Render validé.

**Pour réactiver plus tard les rappels :** `REMINDERS_ENABLED=true` dans Render + `REMINDERS_ENABLED = true` dans `features.ts` puis `npm run deploy:web` ; et, comme le service gratuit dort, déclencher l'envoi de l'extérieur (hors de ce plan).
