# Plan de refonte UX/UI — my-pets

Direction : **sobre, dense en information, monochrome** — inspiration Trade Republic.
Statut : proposition, aucune ligne de code écrite. Périmètre : `app/` (mobile) + 2 ajouts API.

---

## 1. Diagnostic de l'existant

Lecture des écrans actuels (`app/src/app/(app)/…`) :

| # | Problème | Où | Impact |
|---|---|---|---|
| 1 | L'onglet d'accueil ne contient rien : un titre, un sous-titre et un bouton « Voir mes animaux ». Doublon de l'onglet Animaux. | `(app)/index.tsx` (84 l.) | L'app s'ouvre sur un cul-de-sac. |
| 2 | **La proposition de valeur (les rappels) est invisible dans l'app.** Aucun écran ne montre les échéances à venir — elles n'existent que dans les push. | — | L'utilisateur n'a aucune raison d'ouvrir l'app entre deux notifications. |
| 3 | La fiche animal fait trois métiers dans un seul scroll : formulaire d'édition toujours actif → carte « Exporter / Supprimer » → carnet de santé **en dernier**. | `animals/[id]/index.tsx` (304 l.) | Ce qu'on vient consulter est sous la ligne de flottaison, derrière un formulaire. |
| 4 | Le « carnet de santé » est une liste plate de `ListRow` : pas de regroupement, pas de séparation passé / à venir, pas d'ordre lisible. | idem, l. 286-299 | Illisible dès ~10 événements. |
| 5 | La suppression (destructive) est à deux doigts de l'export, au milieu de l'écran. | idem, l. 251-260 | Risque d'erreur. |
| 6 | Tout est empilé dans des `Card` bordées : bordure sur la carte **et** bordure sur chaque `ListRow` à l'intérieur. | `ui/card.tsx`, `ui/list-row.tsx` | Bruit visuel, l'inverse d'une direction sobre. |
| 7 | Onglet « Home » en anglais, le reste en français. | `components/app-tabs.tsx` | Incohérence. |
| 8 | Réglages = rappels + déconnexion. Pas d'email du compte, pas de version, pas de mentions. | `(app)/settings.tsx` | Écran creux. |
| 9 | L'API n'expose **aucune** route d'échéances multi-animaux (routes toutes imbriquées sous `/animals/:id`). | `api/src/health-events/…` | Bloquant pour un vrai écran d'accueil. |

---

## 2. Direction visuelle

### Le principe

Trade Republic n'est pas « du gris ». C'est : **une seule information hiérarchisée par écran**, des surfaces sans bordure, des filets d'un pixel à la place des cadres, des chiffres énormes, et de la couleur **uniquement pour dire un état** — jamais pour décorer.

Traduction pour un carnet de santé : le chiffre qui compte n'est pas un montant, c'est **un nombre de jours avant une échéance**.

### Palette (tokens à remplacer dans `global.css` + `constants/theme.ts`)

Le changement de fond : le teal `#0D9488` cesse d'être la couleur des boutons. **L'action primaire devient l'encre** (bouton noir sur fond blanc, blanc sur fond noir en sombre) — c'est le geste le plus « TR » du lot. Le teal est rétrogradé au rang de couleur d'état positif, aux côtés de l'ambre et du rouge.

| Rôle | Clair | Sombre |
|---|---|---|
| `surface` | `#FFFFFF` | `#0B0B0C` |
| `surface-elevated` | `#FAFAFA` | `#141416` |
| `border` (filet 1px) | `#EBEBEF` | `#232326` |
| `text` | `#0A0A0B` | `#FAFAFA` |
| `text-secondary` | `#71717A` | `#9A9AA2` |
| `text-tertiary` | `#A1A1AA` | `#6E6E76` |
| `primary` (action) | `#0A0A0B` | `#FAFAFA` |
| `on-primary` | `#FFFFFF` | `#0A0A0B` |
| `status-ok` | `#0D9488` | `#2DD4BF` |
| `status-soon` | `#B45309` | `#FBBF24` |
| `status-late` | `#DC2626` | `#F87171` |

Trois couleurs d'état, et rien d'autre de coloré à l'écran.

### Typographie

Police système (SF Pro / Roboto) — sur mobile, c'est le choix sobre, pas le choix paresseux. Ce qui change, c'est **l'échelle et le chiffre** :

```
metric   48 / 52  semibold, tabular-nums, tracking -1.5   → le compte à rebours
display  32 / 38  semibold, tracking -0.6                 → titre d'écran
title    22 / 28  semibold
headline 17 / 22  medium
body     15 / 20  regular
caption  13 / 16  medium
eyebrow  11 / 14  semibold, uppercase, tracking +0.8      → libellés de section
```

Ajout requis : `fontVariant: ['tabular-nums']` sur tous les nombres et toutes les dates (sinon les colonnes de dates dansent).

### Signature : le compteur

**Un seul objet visuel, décliné partout** : le compte à rebours d'une échéance.

- Écran Aujourd'hui : en `metric` 48px, plein cadre, c'est le héros.
- Ligne d'un animal : en `caption`, à droite, coloré selon l'état.
- Timeline : en pastille devant l'événement à venir.

Même donnée, trois tailles. C'est ça qui fait qu'une app a l'air dessinée par une seule personne.

### Ce qui disparaît

- Les bordures de `Card` → sections sans cadre, séparées par du blanc et un filet.
- Les bordures de `ListRow` → filet inter-lignes uniquement (`border-b`, pas sur le dernier).
- Les emojis dans les titres (`my-pets 🐾`).
- Les boutons pleins pour les actions secondaires → texte + chevron.

---

## 3. Nouvelle architecture des écrans

### Onglets

| Avant | Après |
|---|---|
| Home (vide) | **Aujourd'hui** — échéances, toutes espèces confondues |
| Mes animaux | **Animaux** — liste + accès aux carnets |
| Réglages | **Réglages** — compte, rappels, à propos |

### Écran 1 — Aujourd'hui *(nouveau)*

```
┌──────────────────────────────┐
│ Aujourd'hui                  │  display
│                              │
│ PROCHAINE ÉCHÉANCE           │  eyebrow, text-tertiary
│ 12                           │  metric 48 — status-soon
│ jours                        │  caption
│ Rappel vaccin CHPL · Nala    │  headline
│                              │
│ ──────────────────────────── │  filet
│ À VENIR (90 JOURS)           │  eyebrow
│ Nala    Vermifuge      J-34  │
│ Miko    Rappel rage    J-61  │
│ ──────────────────────────── │
│ DERNIERS ÉVÉNEMENTS          │  eyebrow
│ Nala    Visite     14 août   │
└──────────────────────────────┘
```

État vide (0 animal) : le compteur est remplacé par une invitation — « Aucun animal suivi. » + « Ajouter un animal ». L'onboarding actuel (`ONBOARDING_STEPS`) migre ici, en trois lignes sans carte.
État « rien à venir » : « Aucune échéance dans les 90 jours. » — pas de dessin, pas d'illustration.

### Écran 2 — Animaux

```
┌──────────────────────────────┐
│ Animaux                 +    │  display + action header
│ ──────────────────────────── │
│ ◯  Nala                      │  avatar 44
│    Chien · 3 ans        J-12 │  caption / compteur coloré
│ ──────────────────────────── │
│ ◯  Miko                      │
│    Chat · 7 ans         J-61 │
└──────────────────────────────┘
```

Changements : l'âge apparaît dans la ligne (déjà calculé par `computeAge`), le compteur d'échéance aussi, le FAB flottant cède la place à un `+` dans l'en-tête — plus sobre, et il ne masque plus la dernière ligne.

### Écran 3 — Fiche animal *(refonte structurelle)*

Principe : **on consulte, on n'édite pas.** L'édition devient une destination.

```
┌──────────────────────────────┐
│ ‹                     Modifier│
│         ◯ 88                 │
│         Nala                 │  title
│      Chien · 3 ans           │  caption, text-secondary
│                              │
│ ┌──────────┐ ┌─────────────┐ │
│ │ + Événement│ │ ⤓ Exporter │ │  actions, pas de rouge ici
│ └──────────┘ └─────────────┘ │
│ ──────────────────────────── │
│ À VENIR                      │  eyebrow
│ ● Rappel vaccin CHPL   J-12  │
│ ──────────────────────────── │
│ 2026                         │  eyebrow — regroupement annuel
│   Vaccin CHPL      14 août   │
│   Visite contrôle  02 mars   │
│ 2025                         │
│   Vermifuge        11 déc.   │
└──────────────────────────────┘
```

- `animals/[id]/edit.tsx` **(nouveau)** : le formulaire actuel (nom, espèce, date, photo) + « Supprimer » isolé en bas, séparé par du vide, en texte rouge — pas en bouton plein.
- La suppression quitte donc la fiche de consultation.
- La timeline est groupée : bloc « À venir » (basé sur `nextDueDate`), puis les événements passés par année décroissante.

### Écran 4 — Réglages

Trois sections à filets, sans cartes : **Compte** (email, déconnexion) · **Rappels** (les chips J-30…Jour J, inchangés fonctionnellement) · **À propos** (version, mentions). L'email vient de `useSession()`, il est déjà disponible et n'est affiché nulle part aujourd'hui.

---

## 4. Ce qu'il faut côté API

Deux ajouts, sinon l'écran Aujourd'hui fait N+1 appels :

1. `GET /health-events/upcoming?days=90` — échéances tous animaux confondus pour l'utilisateur courant, triées, avec le nom de l'animal. Nouveau contrôleur non imbriqué dans le module `health-events`.
2. `GET /animals` enrichi : ajouter `nextDueDate` et `eventCount` à chaque animal (un `groupBy` Prisma, pas une requête par animal).

Sans le point 1, l'accueil devrait charger tous les animaux puis leurs événements un par un.

---

## 5. Découpage en lots

| Lot | Contenu | Fichiers | Estimation |
|---|---|---|---|
| **L0** | Tokens : palette, échelle typo, `tabular-nums`. `global.css` + `constants/theme.ts` **ensemble** (contrainte AGENTS.md). | 2 | 0,5 j |
| **L1** | Primitives : `Card` sans bordure → `Section`, `ListRow` à filets, `Metric` (nouveau), `Badge` → statut d'échéance, `Divider`. Tests `ui/__tests__` mis à jour. | ~8 | 1 j |
| **L2** | API : route `upcoming` + enrichissement de `GET /animals` + méthodes dans `lib/api.ts`. | ~5 | 0,5 j |
| **L3** | Écran **Aujourd'hui** + migration de l'onboarding + renommage des onglets. | 3 | 1 j |
| **L4** | **Fiche animal** scindée : consultation vs `edit.tsx`, timeline groupée. | 3 | 1 j |
| **L5** | Liste animaux enrichie, Réglages restructuré. | 2 | 0,5 j |
| **L6** | Passe finale : copie FR homogène (« Enregistrer » partout, jamais « Valider »), états vides, contrastes, mode sombre, `graphify update .`. | — | 0,5 j |

Total ≈ **5 jours**. L0→L1 sont prérequis de tout le reste ; L2 peut être fait en parallèle.

Ordre recommandé : **L0 → L1 → L2 → L3 → L4 → L5 → L6.**

---

## 6. Points à trancher avant de coder

1. **Bouton primaire noir** (parti pris TR) ou **bouton teal conservé** ? C'est le choix qui décide de l'identité de toute l'app.
2. **Onglet Aujourd'hui** comme écran d'ouverture, ou ouvrir directement sur Animaux et faire des échéances une section de cette liste (2 onglets au lieu de 3) ?
3. **L2 (API) maintenant ou plus tard** ? Sans lui, l'accueil reste possible mais avec un chargement séquentiel visible dès 4-5 animaux.
