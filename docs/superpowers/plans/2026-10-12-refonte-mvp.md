# Refonte MVP (variante F) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire passer l'app mobile au design « variante F » (noir et blanc, gros chiffres, listes à filets, portraits d'animaux, icônes pastel par type) et la réduire à un MVP de 5 écrans : Connexion/Inscription, Mes animaux, Animal (création/modification), Fiche animal (poids en vedette + chronologie unifiée), Nouvelle entrée (vaccin / soin / visite / pesée).

**Spec visuelle (autorité) :** `app/mockups/f-photos.html` — ouvrir ce fichier dans un navigateur ; les valeurs de taille, rayon, espacement et couleur y sont exactes. Thème clair ET noir (bouton « Noir » de la page). Les tokens de couleur existent déjà dans `src/constants/theme.ts` / `src/global.css` / `tailwind.config.js` (palette noir et blanc, `type-*`, police Nunito via `src/constants/fonts.ts` et `src/components/ui/text.tsx`).

**Architecture:** Pas de changement d'architecture ni d'API serveur. On restyle les primitives de `src/components/ui/` en gardant leurs **props publiques**, puis on recompose les écrans du MVP dessus. La navigation passe de 4 onglets natifs à une pile. Les écrans hors MVP sont **débranchés (plus aucun lien ni onglet), jamais supprimés**.

**Tech Stack:** Expo SDK 56 · React Native 0.85.3 · NativeWind 4.2.6 · TypeScript strict · jest-expo + @testing-library/react-native 14.

## Global Constraints

- Toutes les commandes s'exécutent depuis `app/` (dépôt git autonome ; la racine `my-pets/` n'en est pas un). Alias `@/*` → `./src/*`.
- Branche : `feat/refonte-mvp`, créée depuis `feat/ux-fondations` (Task 1).
- **Expo a changé** : lire `https://docs.expo.dev/versions/v56.0.0/` avant tout code Expo (cf. `app/AGENTS.md`). Toute dépendance s'installe avec `npx expo install`.
- **Imports** : les écrans importent depuis le barrel `@/components/ui`. Tout nouveau composant partagé y est exporté. Le `Text`/`TextInput` de l'app est `@/components/ui/text` (applique la police) — l'utiliser à la place de ceux de `react-native` dans le code touché.
- **Zéro couleur codée en dur, zéro variante `dark:`** dans le code touché : uniquement les tokens (`bg-surface`, `text-text-secondary`, `bg-type-vaccine`…). Les props RN qui exigent une couleur résolue passent par `Colors[thème]` de `theme.ts`.
- **Props publiques inchangées** pour `Button`, `Input`, `FormField`, `Chip`, `SegmentedControl`, `ListRow`, `Badge`, `Card` (des écrans hors MVP les utilisent) : on change l'apparence, pas l'API. `Avatar` peut gagner des tailles, pas en perdre le nom.
- Tout élément interactif : cible ≥ 44 pt et nom accessible. Texte agrandi supporté (pas de hauteur fixe qui tronque un libellé).
- Langue de l'UI : **français**. Zéro emoji dans l'UI.
- **API de test — RNTL 14** : `render()` et `fireEvent.*()` retournent des Promises ; tout test qui rend est `async` avec `await` sur les deux. Pas de `/// <reference types="jest" />`.
- **Interdit de modifier la logique métier** hors tâches qui la nomment (Tasks 8, 9, 10) : appels API, validation (`src/lib/forms/schemas.ts`), navigation de données gardent leur comportement. Aucun changement dans `api/`.
- `SOON_THRESHOLD_DAYS = 14` dans `src/lib/health-events.ts` reste la règle « bientôt » (état ambre) — ne pas la changer.
- Commits : Conventional Commits, message en **français**, un commit par tâche après vérification verte. Terminer le message par `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Vérification minimale de chaque tâche : `npm test` (tout vert), `npx tsc --noEmit` sans **nouvelle** erreur dans les fichiers touchés (la base a ~38 erreurs préexistantes dans des écrans hors MVP — ne pas les corriger, ne pas en ajouter), `npm run lint` sans nouvelle erreur.
- Limite connue : la vérification visuelle en simulateur dépend d'une API joignable ; les implementers vérifient par tests + types, le contrôleur fait la passe visuelle finale.

---

## File Structure

| Zone | Fichiers |
|---|---|
| Primitives | `src/components/ui/{button,input,form-field,field-shell,chip,segmented-control,avatar,list-row,type-icon}.tsx`, `index.ts` |
| Navigation | `src/app/(app)/_layout.tsx`, `src/components/app-tabs.tsx` (+ `.web`), `src/app/(app)/index.tsx` |
| Écrans MVP | `src/app/sign-in.tsx`, `src/app/sign-up.tsx`, `src/app/(app)/index.tsx` (Mes animaux), `src/app/(app)/animals/new.tsx`, `animals/[id]/edit.tsx`, `animals/[id]/index.tsx`, `animals/[id]/events/new.tsx` |
| Logique | `src/lib/timeline.ts` (nouveau) + `src/lib/__tests__/timeline.test.ts` |

---

### Task 1: Base saine et branche

**Files:** aucun nouveau — consolider le travail non commité (palette noir et blanc, couleurs `type-*`, Nunito : `theme.ts`, `global.css`, `tailwind.config.js`, `fonts.ts`, `text.tsx`, `_layout.tsx` racine, `package.json`/lock, `tokens.test.tsx`, `ui/index.ts`).

- [ ] Créer la branche `feat/refonte-mvp` depuis l'état courant (`git switch -c feat/refonte-mvp`) ; les modifications non commitées la suivent.
- [ ] Vérifier que `src/app/_layout.tsx` charge bien les polices (`useFonts(AppFontSources)`) et retient le rendu/splash tant qu'elles ne sont pas prêtes ; corriger si ce n'est pas le cas.
- [ ] Vérifier que `theme.ts` et `global.css` sont synchronisés (le test de sync existant doit passer) et que les 8 clés `type*` existent dans les deux thèmes des deux fichiers.
- [ ] Lancer `npm test`, `npx tsc --noEmit` (noter le nombre d'erreurs de départ dans le rapport), `npm run lint`.
- [ ] Commit : `feat(ui): palette noir et blanc, couleurs par type d'entrée et police Nunito`. Ne pas committer `mockups/` ni `graphify-out/` ; committer `mockups/` séparément est autorisé : `docs: maquettes HTML de la refonte`.

**Done quand :** branche créée, tests verts, commit présent, rapport donnant le nombre d'erreurs `tsc` de départ.

---

### Task 2: Boutons et contrôles de formulaire

**Files:** `button.tsx`, `input.tsx`, `form-field.tsx`, `field-shell.tsx`, `chip.tsx`, `segmented-control.tsx` et leurs tests dans `__tests__/`.

Spec (référence : phones de `f-photos.html`) :
- **Button** : `primary` = fond `bg-primary` / texte `text-on-primary`, hauteur 52, `rounded-md` (rayon 14 → ajuster le token `md` si besoin ou utiliser `rounded-[14px]`), libellé 16 px bold (`font-bold`), pas de bordure. `secondary` = fond `bg-surface-sunken`, texte `text-text`. `ghost` = texte seul. `destructive` = texte `text-danger`, fond transparent. Pressé : opacité réduite. `loading`/`disabled` conservés.
- **Input / FormField / FieldShell** : style souligné. Libellé gris 13 px au-dessus, valeur 18 px `font-semibold`, filet `border-b` 1.5 px `border-border`, au focus filet 2 px `border-text`. Erreur : filet `border-danger` + message `text-danger` 13 px (région live polie conservée).
- **Chip** : pilule `rounded-full`, `px-4 py-2`, 14 px bold ; non sélectionné `bg-surface-sunken text-text` ; sélectionné `bg-text text-surface`.
- **SegmentedControl** : piste `bg-surface-sunken rounded-xl p-[3px]`, segment actif `bg-surface text-text`, inactifs `text-text-secondary`, 14 px bold.

- [ ] Mettre à jour/ajouter les tests : variantes de Button (primary a bien le fond plein), focus/erreur d'Input, état sélectionné de Chip, segment actif de SegmentedControl.
- [ ] `npm test`, `tsc`, `lint` verts selon les contraintes globales.
- [ ] Commit : `feat(ui): boutons pleins, champs soulignés, pastilles et segments au style F`.

---

### Task 3: Avatar, TypeIcon et ListRow

**Files:** `avatar.tsx`, `list-row.tsx`, nouveau `type-icon.tsx`, `index.ts`, tests associés.

Spec :
- **Avatar** : tailles `xs`=32, `sm`=44, `md`=60, `lg`=92, `xl`=112 (px). Photo `expo-image` ronde ; sans photo : repli icône patte sur `bg-surface-sunken`. Nouvelle prop `editable?: boolean` : affiche une pastille ronde 30 px en bas à droite (fond `bg-text`, icône appareil photo `text-surface`, bordure 3 px `border-surface`). Le nom `Avatar`, `AvatarSize`, `uri`, `label`, `testID` restent. Les valeurs `sm`/`lg` existantes changent de taille (44 / 92) : c'est voulu.
- **TypeIcon** (nouveau, exporté du barrel) : prop `type: 'VACCINE' | 'TREATMENT' | 'VISIT' | 'WEIGHT'`, rond 44 px, fond `bg-type-<x>` et icône colorée `type-<x>-fg` (couleur résolue depuis `Colors`). Icônes : vaccin, traitement, visite (existantes dans `icon.tsx`) et **balance** — ajouter `scale` à `icon.tsx` (MaterialCommunityIcons `scale-bathroom`). Décoratif (`decorative`).
- **ListRow** : titre 17 px bold, sous-titre 14 px `text-text-secondary`, `leading` / `trailing` conservés, filet séparateur géré par l'appelant. Hauteur min 44 conservée.

- [ ] Tests : tailles d'Avatar, présence de la pastille quand `editable`, les 4 `TypeIcon` rendent leur icône, ListRow rend `trailing`.
- [ ] Commit : `feat(ui): avatar à tailles et pastille, pastille de type d'entrée`.

---

### Task 4: Navigation en pile

**Files:** `src/app/(app)/_layout.tsx`, `src/components/app-tabs.tsx`, `src/components/app-tabs.web.tsx`, `src/app/(app)/index.tsx`, `src/app/(app)/animals/_layout.tsx`.

- [ ] `(app)/_layout.tsx` devient un `Stack` sans header natif (`headerShown: false`) ; plus d'`AppTabs` rendu. Laisser `app-tabs*.tsx` dans le dépôt, non utilisés.
- [ ] `(app)/index.tsx` devient l'écran **Mes animaux** (la route d'entrée) : pour cette tâche, un squelette qui redirige vers/affiche la liste existante `animals/index.tsx` (la vraie refonte de l'écran est la Task 6). Le contenu « Aujourd'hui » actuel n'est plus la page d'accueil.
- [ ] Toute navigation vers `/animals` ou l'ancien accueil encore présente dans les écrans MVP pointe vers `/` (Mes animaux). Les écrans hors MVP restent des fichiers mais **plus aucun lien ni onglet n'y mène depuis les écrans MVP**.
- [ ] Vérifier qu'il n'y a pas de route orpheline qui casse le typage des routes (`npx tsc`, pas de nouvelle erreur).
- [ ] Commit : `refactor(nav): pile simple, Mes animaux comme point d'entrée`.

---

### Task 5: Connexion et inscription

**Files:** `src/app/sign-in.tsx`, `src/app/sign-up.tsx`, `src/app/welcome.tsx` (ne plus y mener : l'entrée non connectée = `sign-in`), tests si présents.

Spec (écran 1 de la maquette) : 3 portraits qui se chevauchent (`stack` : tailles 76, bordure 3 px `border-surface`, décalage −16) au-dessus du titre ; titre « Connexion » 32 px ; sous-titre ; champs soulignés (E-mail, Mot de passe) ; bouton plein « Continuer » en pied d'écran ; lien « Créer un compte » / « Se connecter ». Conserver « Mot de passe oublié ? » (route existante). Les portraits sont décoratifs (icône patte sur `bg-type-*` — pas de photos réseau).
- [ ] Corriger au passage les 2 erreurs de typage de ces fichiers : icône `lock` (ajouter `lock` à `icon.tsx` si l'icône est gardée, sinon la retirer) ; `Checkbox` reçoit `onCheckedChange`, pas `onToggle`.
- [ ] Logique de formulaire (`signInSchema`, `signUpSchema`, appels `useSession`) inchangée.
- [ ] Commit : `feat(auth): écrans de connexion et d'inscription au style F`.

---

### Task 6: Mes animaux

**Files:** `src/app/(app)/index.tsx` (écran), `src/app/(app)/animals/index.tsx` (non lié désormais — laisser).

Spec (écran 2) : en-tête « Bonjour <prénom> » + pastille initiale (ouvre une action « Se déconnecter » : `useSession().signOut` ou équivalent existant, avec confirmation `Alert`) ; titre « Mes animaux » 32 px ; liste de `ListRow` : `Avatar` 60 px (`photoUrl`), nom, « Espèce · âge » (`computeAge` de `@/lib/animals`), à droite le dernier poids `latestWeight` en « 4,2 kg » (virgule décimale, `—` si absent) ; filet entre lignes ; ligne finale « Ajouter un animal » (rond neutre 60 px + icône `add`) → `/animals/new`. Tap sur une ligne → `/animals/[id]`. Pull-to-refresh, état de chargement `Skeleton`, état vide `EmptyState` (« Ajoutez votre premier animal »), état d'erreur `ErrorState` avec réessai.
- [ ] Données : `api.listAnimals()` uniquement (plus d'appels foyer/tâches).
- [ ] Commit : `feat(animaux): écran Mes animaux au style F`.

---

### Task 7: Animal — création et modification

**Files:** `src/app/(app)/animals/new.tsx`, `src/app/(app)/animals/[id]/edit.tsx`, éventuel `SpeciesPicker`.

Spec (écran 3) : titre « Nouvel animal » / « Modifier <nom> » ; `Avatar` 112 `editable` (ouvre `expo-image-picker` ; téléversement via la logique existante de photo) ; `Chip` d'espèce (Chat / Chien / Autre — garder `SpeciesPicker` si c'est lui qui porte la logique) ; champs soulignés Nom et Date de naissance (`DateField` existant) ; bouton plein « Enregistrer » en pied ; en modification, lien texte rouge « Supprimer l'animal » avec confirmation `Alert`.
- [ ] Validation `animalSchema` et appels API existants inchangés.
- [ ] Commit : `feat(animaux): formulaire animal au style F`.

---

### Task 8: Chronologie unifiée (logique pure)

**Files:** nouveau `src/lib/timeline.ts`, nouveau `src/lib/__tests__/timeline.test.ts`.

Spec — fonctions pures, sans React :
- `type TimelineEntry = { id: string; kind: 'VACCINE' | 'TREATMENT' | 'VISIT' | 'WEIGHT'; date: string; title: string; detail: string | null; nextDueDate: string | null; source: 'event' | 'weight' }`.
- `buildTimeline(events: HealthEvent[], weights: WeightRecord[]): TimelineEntry[]` — fusionne, trie par date décroissante (égalité : poids après événement, ordre stable). `title` : titre de l'événement ou « Pesée » ; `detail` : pour un poids « 4,2 kg » (virgule), pour un événement `vet`/`dosage` si présent.
- `filterTimeline(entries, filter: 'ALL' | 'VACCINE' | 'CARE' | 'VISIT' | 'WEIGHT')` — `CARE` = `TREATMENT`.
- `weightTrend(weights: WeightRecord[]): { latestKg: number | null; deltaKg: number | null; since: string | null }` — dernier poids, écart avec la pesée précédente, date de la pesée précédente ; `deltaKg`/`since` nuls s'il y a moins de deux pesées.
- `formatKg(n: number): string` — « 4,2 kg ».
- [ ] TDD : tests d'abord (tri, égalités, listes vides, un seul poids, filtres, formatage, arrondi à 1 décimale sans artefact flottant).
- [ ] Aucun import d'écran ; imports de types depuis `@/lib/api`.
- [ ] Commit : `feat(lib): chronologie unifiée événements et pesées`.

---

### Task 9: Fiche animal

**Files:** `src/app/(app)/animals/[id]/index.tsx` (+ suppression des liens vers `weight`/`timeline` dans cet écran).

Spec (écran 4) : barre retour + crayon (→ `edit`) ; `Avatar` 92 + nom 30 px + « Espèce · âge » ; **poids en vedette** `text-hero` (46 px) via `weightTrend` + `formatKg`, variation en vert `text-status-ok` « +0,1 kg depuis <mois> » (rouge `text-status-late` si négative, masquée si inconnue) ; rangée de `Chip` : Tout / Vaccins / Soins / Visites / Pesées (défilement horizontal) ; liste `ListRow` : `TypeIcon` + titre + détail ; pour une entrée avec `nextDueDate` : ligne « Prochain : <date> » en `text-status-soon` quand `deadlineState` = `soon`/`late`, gris sinon ; date à droite ; bouton plein « Ajouter une entrée » en pied → `/animals/[id]/events/new`. Données : `api.getAnimal` (ou `api.listAnimals`), `api.listEvents`, `api.listWeights` en parallèle, fusionnées par `buildTimeline`. États chargement/vide/erreur. Tap sur un événement → `events/[eventId]` existant ; une pesée n'est pas cliquable.
- [ ] Commit : `feat(fiche): fiche animal avec poids en vedette et chronologie unifiée`.

---

### Task 10: Nouvelle entrée

**Files:** `src/app/(app)/animals/[id]/events/new.tsx`, `src/components/health-event-form.tsx` (réutilisé/adapté), `src/lib/forms/schemas.ts` (ajout d'un schéma de pesée uniquement).

Spec (écran 5) : titre « Nouvelle entrée » ; rappel « Pour <nom> » + `Avatar` 32 ; `SegmentedControl` à 4 segments Vaccin / Soin / Visite / Poids ; champs selon le type — vaccin & soin : Date, Produit, Prochaine échéance (facultatif), Note (facultatif) ; visite : Date, Motif, Vétérinaire, Note ; poids : Date, Poids (kg, clavier décimal, virgule acceptée) ; bouton plein « Enregistrer ». Vaccin/soin/visite → `api.createEvent` existant (types `VACCINE`/`TREATMENT`/`VISIT`) ; poids → `api.addWeight(animalId, weightKg, date)`. Après succès : retour à la fiche avec rechargement. Validation : réutiliser `healthEventSchema` ; ajouter `weightEntrySchema` (poids > 0 et < 200, date valide) avec tests dans `schemas.test.ts`. Le scan IA reste caché (`AI_EXTRACTION_ENABLED = false`).
- [ ] Commit : `feat(entrees): formulaire de nouvelle entrée à quatre types`.

---

### Task 11: Finitions et passe qualité

**Files:** écrans MVP, `src/components/ui/{empty-state,error-state,skeleton,toast}.tsx`.

- [ ] États vide / erreur / chargement des 5 écrans cohérents avec le style F (EmptyState, ErrorState, Skeleton restylés si besoin).
- [ ] Tous les éléments interactifs des écrans MVP ont nom accessible et cible ≥ 44 pt ; aucun libellé tronqué à la taille de texte maximale.
- [ ] Aucune couleur codée en dur ni `dark:` dans les écrans MVP (`grep -rnE "#[0-9A-Fa-f]{3,8}\b|dark:" src/app/sign-*.tsx src/app/\(app\)/index.tsx src/app/\(app\)/animals/new.tsx 'src/app/(app)/animals/[id]/index.tsx' 'src/app/(app)/animals/[id]/edit.tsx' 'src/app/(app)/animals/[id]/events/new.tsx'` vide).
- [ ] `tsc` : aucune erreur dans les fichiers MVP. `npm test`, `npm run lint` verts. `graphify update .`.
- [ ] Commit : `chore(ui): finitions des écrans MVP`.
