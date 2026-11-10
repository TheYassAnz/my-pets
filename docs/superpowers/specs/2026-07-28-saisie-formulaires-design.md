# Saisie & formulaires (PET-1, PET-5, PET-6, PET-7, PET-8) — Design Doc

**Date:** 2026-07-28
**Statut:** Validé
**Tickets:** [PET-1](https://yassine-anzarbasha.atlassian.net/browse/PET-1), [PET-5](https://yassine-anzarbasha.atlassian.net/browse/PET-5), [PET-6](https://yassine-anzarbasha.atlassian.net/browse/PET-6), [PET-7](https://yassine-anzarbasha.atlassian.net/browse/PET-7), [PET-8](https://yassine-anzarbasha.atlassian.net/browse/PET-8) — epic [PET-4 Refonte UX/UI](https://yassine-anzarbasha.atlassian.net/browse/PET-4)
**Cadre:** Expo SDK 56 · React Native 0.85 · les cinq tickets sont livrés en un seul lot, socle de formulaire d'abord.

---

## 1. Contexte

Les cinq tickets « Saisie & formulaires » touchent les mêmes fichiers : PET-6 (erreurs par champ) et PET-7 (navigation clavier) portent sur cinq écrans, et PET-1 / PET-5 / PET-8 ajoutent ou remplacent des champs dans ces mêmes écrans. Les traiter séparément imposerait trois passages sur les mêmes formulaires — d'où la livraison en un lot unique.

### 1.1 État réel du code au démarrage

| Constat | Conséquence |
|---|---|
| `birthDate` existe **déjà** en base (`schema.prisma:63`, présent dès la migration `20260625153456_init`), est géré par `animals.service.ts:36`, typé dans `api.ts:113` et imprimé dans l'export PDF | La note technique de PET-8 (« nécessite une migration Prisma ») est caduque : **aucun travail back**, seule l'UI manque |
| Les cinq écrans dupliquent le même schéma : un `useState` par champ, validation dans `onSubmit`, un unique message d'erreur en pied de formulaire | Justifie un socle commun avant de toucher aux écrans |
| `Input` accepte déjà une prop `error`, l'affiche sous le champ et la joint au libellé lu par les lecteurs d'écran (`input.tsx:29`) | PET-6 n'exige **aucune** modification de `Input` |
| `@expo/ui@56.0.18` est déjà installé | Aucune dépendance de picker à ajouter |

### 1.2 Vérification des dépendances natives

La doc en ligne d'Expo 56 documente `@expo/ui/drop-in-replacements/*`, mais la carte d'exports du paquet **réellement installé** (56.0.18) expose ces composants sous `@expo/ui/community/*`. C'est la version installée qui fait foi.

Comportement réel de `@expo/ui/community/picker`, lu dans les sources du paquet :

| Plateforme | Rendu |
|---|---|
| iOS | Roue SwiftUI **toujours visible** (`pickerStyle('wheel')` figé, `focus`/`blur` sont des no-op) |
| Android | Menu déroulant Material 3 (`ExposedDropdownMenuBox`) |
| Web | `<select>` natif |

La roue iOS dépliée en permanence occuperait ~200pt dans un formulaire animal qui ne compte que trois champs — d'où la variante iOS spécifique décrite en §3.3.

## 2. Décisions

| Sujet | Décision | Raison |
|---|---|---|
| Validation (PET-6) | **react-hook-form + zod** (`react-hook-form@7.83`, `zod@4.4.3`, `@hookform/resolvers@5.5.7`) | Standard du marché, schémas réutilisables, types dérivés par `z.infer` |
| Sélecteur d'espèce (PET-1) | **Picker natif `@expo/ui`**, avec variante iOS en `pickerStyle('menu')` | Rendu 100% natif ; le style `menu` évite la roue dépliée sur iOS |
| Sélecteur de date (PET-5, PET-8) | **`@expo/ui/community/datetime-picker`** | Déjà installé ; fournit `minimumDate`/`maximumDate`, `locale`, `themeVariant`, dialog Android, variante web |
| Données espèce existantes | **Aucune reprise** — base vide | Décision utilisateur ; repli défensif conservé si une valeur inconnue survient |
| Écrans mot de passe oublié / réinitialisation | **Hors périmètre** | Absents des critères d'acceptation de PET-6 et PET-7 ; à traiter dans un ticket de suite |

## 3. Architecture

Le socle est livré et testé avant que le moindre écran ne soit modifié.

### 3.1 `src/lib/forms/schemas.ts`

Les schémas zod (`signInSchema`, `signUpSchema`, `animalSchema`, `healthEventSchema`) décrivent en un seul endroit ce qu'est une saisie valide. Les types de formulaire en sont dérivés via `z.infer` plutôt qu'écrits une seconde fois.

### 3.2 `src/components/ui/form-field.tsx`

`FormField` enveloppe le composant `Input` existant dans un `Controller` de react-hook-form et branche `fieldState.error?.message` sur la prop `error`. `Input` n'est pas modifié.

### 3.3 `src/components/ui/species-picker.tsx` (+ `.ios.tsx`)

Liste fermée `SPECIES` : Chien, Chat, Lapin, Oiseau, Rongeur, Reptile, Autre. Le choix `Autre` révèle un champ texte de précision, afin de ne pas bloquer les cas rares (furet, cheval…).

- Fichier par défaut → `@expo/ui/community/picker` (dropdown Android, `<select>` web)
- `species-picker.ios.tsx` → `@expo/ui/swift-ui` avec `pickerStyle('menu')`

La valeur envoyée à l'API reste une chaîne libre : c'est l'UI qui contraint la saisie, pas le modèle. Un animal dont l'espèce ne correspond à aucune entrée de la liste reste donc affichable.

### 3.4 `src/components/ui/date-field.tsx`

Affiche la date formatée en français et ouvre le sélecteur natif à l'appui.

- **Android** : le picker est monté en `presentation: 'dialog'` à l'appui, puis démonté à la réponse (`onValueChange` ou `onDismiss`), conformément à sa documentation
- **iOS** : `display: 'compact'`, `locale: 'fr_FR'`, `themeVariant` piloté par `useColorScheme` — c'est ce qui satisfait le critère « fonctionne en thème clair et sombre »
- `maximumDate` interdit toute date de naissance future (PET-8)
- La date de rappel reste optionnelle et effaçable (PET-5)

### 3.5 Helpers de formatage

`formatDate` existe déjà dans `src/lib/health-events.ts`. On y ajoute le calcul d'âge (`computeAge`) rendant « 3 ans » / « 8 mois » sur la fiche animal.

## 4. Flux de données

Chaque écran devient `useForm({ resolver: zodResolver(schema), mode: 'onTouched' })`.

Le mode `onTouched` produit exactement le comportement exigé par PET-6 — validation à la perte du focus, puis re-validation à chaque frappe une fois le champ en erreur — sans logique maison.

**La valeur transmise à l'API ne change pas** : les dates transitent en ISO (`YYYY-MM-DD`), le format français est purement de l'affichage. Aucune modification back n'est nécessaire, pour aucun des cinq tickets.

## 5. Navigation clavier (PET-7)

Une `ref` par champ texte, chaînée dans l'ordre visuel. Sur tous les champs sauf le dernier : `returnKeyType="next"` et `submitBehavior="submit"`.

`submitBehavior` est l'API de React Native 0.85 ; `blurOnSubmit` n'est conservé que pour compatibilité ascendante. La valeur `"submit"` est précisément ce qui **garde le clavier ouvert** entre deux champs, critère explicite du ticket.

Les champs non textuels (espèce, dates, type d'événement) ne peuvent pas recevoir le focus clavier : la chaîne les saute. Sur le formulaire d'événement, l'enchaînement est donc Titre → Dosage → Vétérinaire → Notes, et c'est Notes qui soumet.

## 6. Gestion des erreurs

Deux niveaux, volontairement distincts :

- **Erreurs de validation** → sous leur champ, via `FormField`. C'est la cible de PET-6.
- **Erreurs d'API ou de réseau** (`ApiError`, « Connexion impossible », « Création impossible ») → conservées en pied de formulaire dans l'état `error` actuel : elles ne se rattachent à aucun champ.

### 6.1 Contradiction assumée dans les critères de PET-6

PET-6 exige à la fois que « les messages d'erreur existants soient conservés à l'identique » et que « l'erreur s'affiche sous le champ concerné ». Or trois messages actuels portent sur deux champs à la fois : `'Email et mot de passe requis'` (`sign-in.tsx:17`, `sign-up.tsx:17`) et `'Nom et espèce requis'` (`new.tsx:17`, `[id]/index.tsx:64`). Les afficher sous un champ précis sans les réécrire est impossible.

**Parti pris retenu** :

| Message | Traitement |
|---|---|
| `'Le mot de passe doit faire au moins 8 caractères'` | Repris mot pour mot |
| `'Les mots de passe ne correspondent pas'` | Repris mot pour mot |
| `'Titre requis'` | Repris mot pour mot |
| `'Email et mot de passe requis'` | Scindé en `'Email requis'` / `'Mot de passe requis'` |
| `'Nom et espèce requis'` | Scindé en `'Nom requis'` / `'Espèce requise'` |
| `'Date requise au format AAAA-MM-JJ'` | Supprimé — le format libre disparaît avec le sélecteur natif (PET-5) |
| `'Date de rappel invalide (AAAA-MM-JJ)'` | Supprimé — même raison |

## 7. Tests

Le harnais existe déjà : jest-expo, `@testing-library/react-native`, 15 fichiers dans `src/components/ui/__tests__`.

Sont ajoutés : les tests des schémas zod (purs et rapides), puis `FormField`, `SpeciesPicker` et `DateField`.

**Risque identifié, levé à l'implémentation** : `@expo/ui` rend des vues natives SwiftUI et Jetpack Compose, absentes sous Jest — un mock semblait probable. Il s'est avéré inutile : `jest-expo` fournit déjà des stubs suffisants, et `DateField` ne monte le sélecteur qu'à l'ouverture. Aucune configuration Jest n'a été ajoutée.

**Bruit résiduel connu** : `form-field.test.tsx` émet trois avertissements React « environment is not configured to support act(...) ». Ils proviennent des mises à jour de `react-hook-form` qui se poursuivent après la fin du test, pendant le nettoyage de Testing Library. Positionner `IS_REACT_ACT_ENVIRONMENT` en `setupFilesAfterEnv` ne les supprime pas ; la configuration correspondante a donc été retirée plutôt que laissée morte. Les tests passent et les assertions sont justes.

## 8. Ordre d'implémentation

1. Socle : `schemas.ts`, `form-field.tsx` (+ tests)
2. Champs : `species-picker.tsx` (+ `.ios.tsx`), `date-field.tsx`, `computeAge` (+ tests)
3. Écrans, du plus simple au plus complexe : `sign-in` → `sign-up` → `animals/new` → `animals/[id]` → `health-event-form`
4. Vérification : `npm run lint` et `npm test`

## 9. Hors périmètre

- Les écrans `forgot-password.tsx` et `reset-password.tsx` (voir §2)
- Toute modification de l'API : aucun des cinq tickets n'en requiert
- La reprise de données espèce : la base est vide (décision utilisateur)
