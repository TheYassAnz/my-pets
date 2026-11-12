# Corrections fiche événement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger 4 anomalies de la fiche événement : suppression impossible sur mobile, mêmes champs pour Vaccin/Soin/Visite, barre de titre incohérente, date future refusée.

**Architecture:** La fiche d'édition (`[eventId].tsx`) abandonne `HealthEventForm` et réutilise `EntryForm` (déjà utilisé par « Nouvelle entrée ») en mode édition : mêmes champs par type et même en-tête sans header natif. `window.confirm`/`window.alert` (aucune popup en PWA mobile) sont remplacés par une modale maison montée une fois à la racine, derrière la même API `confirmAction`/`notifyError`. La date n'est plus bornée à aujourd'hui sauf pour le poids. L'API accepte `null` pour vider un champ optionnel à la mise à jour.

**Tech Stack:** Expo web (react-native-web), Expo Router, NativeWind, react-hook-form + zod, Jest + Testing Library ; NestJS + Prisma côté API.

**Spec:** demande de Yassine du 2026-11-12 (cette conversation) + réponses :
- Suppression : aucune popup n'apparaît sur mobile.
- Champs : reprendre ceux de « Nouvelle entrée » (Vaccin/Soin : Produit, Date, Prochaine échéance, Note ; Visite : Motif, Date, Vétérinaire, Note). Dosage disparaît de l'UI, la donnée existante est conservée.
- En-tête : bouton rond retour + grand titre « Modifier l'entrée » + « Pour <animal> ».
- Dates futures : autorisées pour Vaccin, Soin, Visite ; Poids reste ≤ aujourd'hui.

## Global Constraints

- Textes UI exacts : titre « Modifier l'entrée », toast « Entrée mise à jour », boutons de la modale « Annuler » / libellé de confirmation passé par l'appelant, bouton « OK » pour `notifyError`.
- Aucune migration Prisma (pas de changement de schéma).
- Pas de nouvelle dépendance npm : la modale utilise `Modal` de react-native.
- Un événement existant ne peut pas devenir un Poids : le sélecteur en édition n'a que Vaccin / Soin / Visite.
- Un champ masqué par le type (ex. Dosage, ou Vétérinaire d'un vaccin) n'est jamais envoyé en édition : sa valeur en base est conservée.
- Tests : `npm test` vert dans `app/` et `api/`, `npm run lint` vert dans `app/`.

## Review Focus

1. Vider « Prochaine échéance » ou « Note » en édition puis enregistrer → le champ est vraiment vidé en base (aujourd'hui `undefined` = inchangé). → Task 3 (API) + Task 4 (front envoie `null`).
2. Changer le type d'un événement existant (Vaccin → Visite) en édition → le titre, la date et la note saisis sont conservés (pas de reset comme en création). → Task 4.
3. Annuler la confirmation de suppression → aucun appel `deleteEvent`, l'écran reste ouvert. → Task 4.
4. Deux `confirmAction` successifs (ex. annuler puis réessayer) → la 2ᵉ modale s'ouvre et résout correctement (pas de promesse orpheline). → Task 1.
5. Poids : la date reste bornée à aujourd'hui après un aller-retour Vaccin → Poids. → Task 2.

---

### Task 1: Modale de confirmation maison

**Files:**
- Modify: `app/src/lib/dialog.ts`
- Create: `app/src/components/ui/dialog-host.tsx` (+ export dans `app/src/components/ui/index.ts`)
- Modify: `app/src/app/_layout.tsx` (monter `<DialogHost />` dans `ToastProvider`, à côté de `RootNavigator`)
- Modify: `app/src/app/(app)/animals/[id]/edit.tsx:68`, `app/src/app/(app)/(tabs)/account.tsx:16` (passer les options)
- Test: `app/src/lib/__tests__/dialog.test.ts` (réécrit)

**Interfaces:**
- Produces:
  - `confirmAction(title: string, message: string, opts?: { confirmLabel?: string; destructive?: boolean }): Promise<boolean>` — `confirmLabel` par défaut « Confirmer ».
  - `notifyError(message: string): void`
  - `registerDialogHost(show: (d: DialogRequest) => void): () => void` (dans `dialog.ts`, retourne la fonction de désinscription) ; `DialogRequest = { title: string; message: string; confirmLabel: string; destructive: boolean; cancellable: boolean; resolve: (ok: boolean) => void }`.
  - `DialogHost` : composant sans props, s'enregistre au montage, affiche un `Modal` transparent (titre, message, `Button` « Annuler » si `cancellable`, `Button` confirm en `variant="destructive"` si `destructive`).
- Sans hôte enregistré (tests unitaires isolés), `confirmAction`/`notifyError` retombent sur `window.confirm`/`window.alert`.

- [ ] **Step 1: Écrire les tests qui échouent** dans `dialog.test.ts`, en rendant `<DialogHost />` :
  - `confirmAction('Supprimer cet événement ?', 'Cette action est irréversible.', { confirmLabel: 'Supprimer', destructive: true })` → le titre et le message s'affichent ; presser « Supprimer » → résout `true` et la modale disparaît.
  - même appel, presser « Annuler » → résout `false`.
  - deux appels successifs (annuler puis confirmer) → `false` puis `true`.
  - `notifyError('Oups')` → « Oups » affiché avec un bouton « OK », pas de « Annuler » ; presser « OK » ferme.
  - sans `DialogHost` monté : `window.confirm` mocké est appelé avec `'Titre\nMessage'` (test existant conservé).
- [ ] **Step 2:** `cd app && npx jest src/lib/__tests__/dialog.test.ts` → FAIL (`DialogHost` introuvable).
- [ ] **Step 3: Implémenter** `dialog.ts` (hôte en variable de module) et `dialog-host.tsx` ; monter `<DialogHost />` dans `_layout.tsx` ; passer `{ confirmLabel: 'Supprimer', destructive: true }` dans `edit.tsx` et `{ confirmLabel: 'Se déconnecter' }` dans `account.tsx`.
- [ ] **Step 4:** `cd app && npm test` → PASS (y compris `account.test.tsx`, `app-layout.test.tsx` : mocker `confirmAction` là où un test simulait `window.confirm`).
- [ ] **Step 5: Commit** — `fix(app): modale de confirmation maison (window.confirm muet en PWA mobile)`

### Task 2: Dates futures pour Vaccin, Soin, Visite

**Files:**
- Modify: `app/src/components/entry-form.tsx:148` — `maximumDate={isWeight ? new Date() : undefined}`
- Modify: `app/src/components/health-event-form.tsx:91` — retirer `maximumDate` (écran scan)
- Test: `app/src/__tests__/screens/entry-form.test.tsx`

- [ ] **Step 1: Tests qui échouent** :
  - `it('visite : date future acceptée')` : type Visite, `UNSAFE_getByType(DateField).props.maximumDate` est `undefined` ; changer la date via `onChange('2026-12-01')` du `DateField`, saisir un motif, enregistrer → `createEvent` appelé avec `date: '2026-12-01'`.
  - `it('poids : date bornée à aujourd’hui')` : type Vaccin → Poids, `maximumDate` du champ Date est défini et vaut aujourd'hui (`toIsoDate` = `TODAY`).
- [ ] **Step 2:** `npx jest src/__tests__/screens/entry-form.test.tsx` → FAIL.
- [ ] **Step 3:** appliquer les deux modifications ci-dessus.
- [ ] **Step 4:** même commande → PASS.
- [ ] **Step 5: Commit** — `fix(app): dates futures autorisées pour vaccin, soin et visite`

### Task 3: API — vider un champ optionnel à la mise à jour

**Files:**
- Modify: `api/src/health-events/dto/create-health-event.dto.ts` — `dosage`, `vet`, `notes`, `nextDueDate` typés `string | null` (`@IsOptional()` laisse déjà passer `null`).
- Modify: `api/src/health-events/health-events.service.ts:52-62` (`update`) — `nextDueDate: dto.nextDueDate === null ? null : dto.nextDueDate ? new Date(dto.nextDueDate) : undefined` ; les champs texte passent tels quels (`null` vide, `undefined` conserve).
- Modify: `app/src/lib/api.ts:217` — `HealthEventInput` : mêmes 4 champs en `?: string | null`.
- Test: `api/src/health-events/health-events.service.spec.ts`

- [ ] **Step 1: Test qui échoue** : `update(owner, animal, id, { nextDueDate: null, notes: null })` → `prisma.healthEvent.update` appelé avec `data` contenant `nextDueDate: null, notes: null` ; et `update(..., { title: 'x' })` → `nextDueDate: undefined`.
- [ ] **Step 2:** `cd api && npx jest health-events.service` → FAIL.
- [ ] **Step 3:** implémenter.
- [ ] **Step 4:** `cd api && npm test && npm run build` → PASS.
- [ ] **Step 5: Commit** — `fix(api): null vide un champ optionnel d'un événement`

### Task 4: Fiche événement = EntryForm en mode édition

**Files:**
- Modify: `app/src/components/entry-form.tsx`
- Modify: `app/src/app/(app)/animals/[id]/events/[eventId].tsx` (réécrit)
- Modify: `app/src/app/(app)/animals/_layout.tsx:17` — `options={{ headerShown: false }}`
- Test: `app/src/__tests__/screens/entry-form.test.tsx`, Create: `app/src/__tests__/screens/event-detail.test.tsx`

**Interfaces:**
- Consumes: `confirmAction(..., { confirmLabel, destructive })` (Task 1) ; `HealthEventInput` avec `null` (Task 3).
- Produces: `EntryForm` props `{ animalId: string; animal?: { name: string; photoUrl?: string | null }; event?: HealthEvent; onDelete?: () => void }`. `event` présent ⇒ mode édition.

Comportement du mode édition :
- Titre « Modifier l'entrée » ; options Vaccin / Soin / Visite (pas Poids) ; valeurs initiales depuis `event` (`date`/`nextDueDate` tronqués à 10 caractères, textes `?? ''`).
- Changer de type ne réinitialise rien (seul `type` change).
- Enregistrer → `api.updateEvent(animalId, event.id, payload)` puis toast « Entrée mise à jour » et `router.back()`. `payload` = `{ type, title, date, notes }` + `vet` si Visite, sinon `nextDueDate` ; un champ visible vide est envoyé `null` ; `dosage` jamais envoyé.
- `onDelete` fourni ⇒ `Button` « Supprimer » `variant="destructive"` `icon="trash"` en fin de ScrollView.
- Le mode création est inchangé (tests existants verts).

- [ ] **Step 1: Tests qui échouent** dans `entry-form.test.tsx` (`describe('Modifier l’entrée')`, `mockUpdateEvent` ajouté au mock de `@/lib/api`) avec `event = { id: 'e1', type: 'VACCINE', title: 'Rage', date: '2026-11-21T00:00:00.000Z', dosage: '1 ml', vet: null, notes: null, nextDueDate: '2026-11-29T00:00:00.000Z' }` :
  - affiche « Modifier l'entrée », champ Produit = « Rage », pas d'option « Poids », pas de champ « Dosage ».
  - enregistrer sans modifier → `updateEvent('a1', 'e1', { type: 'VACCINE', title: 'Rage', date: '2026-11-21', notes: null, nextDueDate: '2026-11-29' })` (pas de clé `dosage`), toast « Entrée mise à jour », `router.back`.
  - vider « Prochaine échéance » (`onChange(null)`) → payload `nextDueDate: null`.
  - passer en Visite → Motif vaut « Rage » ; payload contient `vet: null` et pas de `nextDueDate`.
  - `onDelete` fourni → presser « Supprimer » l'appelle.
- [ ] **Step 2:** tests `event-detail.test.tsx` (écran `[eventId]`, `useLocalSearchParams` → `{ id: 'a1', eventId: 'e1' }`, `useFocusEffect` mocké en `useEffect`, `confirmAction` mocké) :
  - charge `getEvent` + `getAnimal`, affiche « Modifier l'entrée » et « Pour Nala ».
  - Supprimer + confirmation `true` → `deleteEvent('a1', 'e1')` puis `router.back`.
  - Supprimer + confirmation `false` → aucun `deleteEvent`, pas de `router.back`.
- [ ] **Step 3:** `npx jest src/__tests__/screens/entry-form.test.tsx src/__tests__/screens/event-detail.test.tsx` → FAIL.
- [ ] **Step 4: Implémenter** `EntryForm` (mode édition) ; réécrire `[eventId].tsx` : charge l'événement (skeleton / `ErrorState` comme aujourd'hui) et l'animal (échec ignoré, comme `new.tsx`), rend `<EntryForm animalId event animal onDelete />` ; `onDelete` = `confirmAction('Supprimer cet événement ?', 'Cette action est irréversible.', { confirmLabel: 'Supprimer', destructive: true })` puis `deleteEvent`, `router.back()`, erreur → `notifyError`. `HealthEventForm` reste (utilisé par `scan.tsx`).
- [ ] **Step 5:** `cd app && npm test && npm run lint` → PASS.
- [ ] **Step 6: Vérif navigateur** (`npm run web`, viewport mobile 375×812) : ouvrir un vaccin → en-tête rond + « Modifier l'entrée », champs Produit/Date/Prochaine échéance/Note ; supprimer → modale maison → retour fiche animal sans l'événement ; ajouter une visite au 01/12/2026 → enregistrée. Screenshot.
- [ ] **Step 7: Commit** — `fix(app): fiche événement alignée sur Nouvelle entrée (champs, en-tête, suppression)`

### Vérification finale (humaine)

- [ ] Sur le téléphone de Yassine, PWA installée après déploiement Vercel : suppression d'un événement et d'un animal, déconnexion — la modale apparaît et fonctionne.
