# Refonte UX my-pets — Design Doc

**Date:** 2026-07-21
**Statut:** Validé (structure), palette à trancher (§2.2)
**Cadre:** iOS HIG + Material 3 · dark mode sémantique obligatoire · accessibilité standard mobile · composants sur-mesure NativeWind · structure bottom-up en 6 lots.

---

## 1. Contexte & objectif

L'app my-pets est fonctionnelle (phases 0-6 code complete) mais visuellement générique et porteuse de dette structurelle. Objectif : la mettre au niveau des derniers standards UX mobiles (iOS HIG + Material 3) avant la beta (phase 7), sans toucher au périmètre hors-scope MVP (partage vet, multi-user, graphs poids, abonnement).

### 1.1 Constats d'audit (cause racine → symptômes)

| # | Constat | Sévérité |
|---|---------|----------|
| 1 | **Pas de design system** : `tailwind.config.js` theme vide ; couleurs hardcodées + variantes `dark:` répétées à la main dans chaque écran ; `constants/theme.ts` utilisé seulement par la tab bar → 2 systèmes de theming déconnectés | 🔴 |
| 2 | **Zéro composant réutilisable** : Button (~8 copies), Input (~15 copies), Card/ListRow/erreur/segmented control copiés-collés | 🔴 |
| 3 | **Icônes = emoji** (🐾💉💊🩺📷📄🔔) — pas un système ; VoiceOver lit l'emoji ; tab bar avec 2 icônes identiques (`explore.png`) ; fichier `explore.tsx` = nom template pour l'écran Réglages | 🟠 |
| 4 | **Dates en texte** `"AAAA-MM-JJ"` + regex, pas de date picker natif ; espèce en texte libre | 🟠 |
| 5 | **États pauvres** : loading = spinner nu ; empty states plats sans CTA ; error = plein écran rouge sans retry ; pas de pull-to-refresh ; pas de toast succès | 🟠 |
| 6 | **Formulaires** : pas de labels visibles (placeholder-only), validation au submit only, pas de chaînage clavier | 🟡 |
| 7 | **Accessibilité** : aucun `accessibilityLabel`/`Role` ; placeholder `#9ca3af` contraste ~2.5:1 (échec) ; cibles < 44pt (chips, "Plus tard") ; pas de Dynamic Type | 🟡 |
| 8 | **Navigation** : Home mélange onboarding + statut + déconnexion (pas de vrai contenu) ; détail animal = un scroll géant (voir/éditer non séparés) | 🟡 |
| 9 | **Micro-interactions** : seul feedback = `active:opacity` ; pas de haptics ; pas de transitions (reanimated 4 déjà présent, inutilisé) | ⚪ |

### 1.2 Décisions cadrées (avec l'utilisateur)

- Référence standard : **iOS HIG + Material Design 3**.
- Dark mode : **obligatoire**, via tokens sémantiques (pas de couleurs hardcodées).
- Accessibilité : **standard mobile de base** (Dynamic Type, contraste, cibles ≥44pt, labels VoiceOver/TalkBack sur actions clés). Pas d'audit WCAG formel.
- Composants : **sur-mesure NativeWind** (pas de lib externe type Tamagui/gluestack).
- Effort : **gros chantier**, en lots livrables indépendamment.
- Structure : **bottom-up** (fondations d'abord).
- Identité : **palette pet-care chaleureuse** (sort du bleu Tailwind générique).

---

## 2. Design system (Lot 1)

### 2.1 Tokens sémantiques

Principe : les écrans n'écrivent plus jamais `bg-white dark:bg-black`. Ils écrivent `bg-surface`. Chaque token porte sa paire light/dark, résolue par NativeWind selon le colorScheme. Source unique = `tailwind.config.js` (via CSS vars) alignée avec `constants/theme.ts` (pour la tab bar native qui a besoin de valeurs JS).

**Tokens sémantiques (indépendants de la couleur de marque) :**

| Token | Rôle | Light | Dark |
|-------|------|-------|------|
| `surface` | fond d'écran | `#FFFFFF` | `#0B0B0C` |
| `surface-elevated` | cartes, feuilles | `#F7F7F8` | `#1A1A1D` |
| `surface-sunken` | champs, zones creuses | `#F0F0F3` | `#212225` |
| `border` | séparateurs, contours | `#E3E3E7` | `#2E3135` |
| `text` | texte principal | `#0B0B0C` | `#F5F5F7` |
| `text-secondary` | texte secondaire | `#60646C` | `#B0B4BA` |
| `text-tertiary` | placeholders (contraste ≥4.5:1) | `#6B7280` | `#9AA0A6` |
| `danger` | destructif | `#DC2626` | `#F87171` |
| `danger-surface` | fond destructif léger | `#FEF2F2` | `#3B1614` |
| `success` | succès | `#16A34A` | `#4ADE80` |
| `warning` | rappel / échéance | `#D97706` | `#FBBF24` |

> Correction directe de l'audit #7 : `text-tertiary` remplace `#9ca3af` (2.5:1 → ≥4.5:1).

### 2.2 Palette de marque — 3 directions à trancher

Chaque direction = couleur primaire (échelle 50→900) + son usage light/dark. On garde une seule couleur primaire (le neutre + sémantiques ci-dessus sont communs aux 3).

**Direction A — Teal Santé** *(recommandée : évoque soin/médical sans froideur clinique, contraste excellent en dark)*

| Échelle | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| Hex | `#F0FDFA` | `#CCFBF1` | `#99F6E4` | `#5EEAD4` | `#2DD4BF` | `#14B8A6` | `#0D9488` | `#0F766E` | `#115E59` | `#134E4A` |

- `primary` (bouton, accent) : **600** `#0D9488` (light) / **400** `#2DD4BF` (dark)
- `primary-pressed` : 700 / 500 · `primary-surface` (fond léger) : 50 / `#0C2E2B`

**Direction B — Corail Chaleureux** *(plus émotionnel/affectif, "compagnon", plus audacieux)*

| Échelle | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| Hex | `#FFF5F2` | `#FFE3D9` | `#FFC7B3` | `#FFA688` | `#FF835E` | `#FB6640` | `#E84E28` | `#C13C1D` | `#9A301A` | `#7C2917` |

- `primary` : **600** `#E84E28` (light) / **400** `#FF835E` (dark)
- ⚠️ attention : corail proche du `danger` rouge → il faudra bien différencier destructif (rouge pur) vs primary (corail orangé).

**Direction C — Vert Sauge** *(doux, naturel, apaisant, très "wellness")*

| Échelle | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| Hex | `#F4F7F2` | `#E3EBDD` | `#C6D8BC` | `#A3C093` | `#7FA76B` | `#628C4E` | `#4C7139` | `#3D5A2E` | `#324A27` | `#2A3E21` |

- `primary` : **600** `#4C7139` (light) / **400** `#7FA76B` (dark)

> **À décider :** A, B ou C. Recommandation = **A (Teal Santé)**. Le reste du doc suppose A ; changer de direction ne modifie que la valeur du token `primary`.

### 2.3 Typographie

Échelle mappée sur la police système iOS (`Fonts.sans` = `system-ui`), Dynamic Type ready (tailles relatives, `allowFontScaling` par défaut).

| Rôle | Taille / Line-height | Poids | Usage |
|------|---------------------|-------|-------|
| `display` | 30 / 36 | bold | titre écran home |
| `title` | 22 / 28 | bold | titres de section |
| `headline` | 17 / 22 | semibold | titres de carte / ligne |
| `body` | 16 / 22 | regular | texte courant, inputs |
| `callout` | 15 / 20 | regular | sous-titres |
| `caption` | 13 / 18 | regular | métadonnées, labels |

### 2.4 Spacing / radius

Réutiliser `Spacing` de `constants/theme.ts` (`half→six`), le brancher dans Tailwind. Radius : `sm` 8 / `md` 12 / `lg` 16 / `full` 9999. Cibles tactiles : hauteur min **44pt** sur tout élément interactif (token `min-h-11`).

---

## 3. Librairie de composants (Lot 2)

Composants sur-mesure NativeWind dans `src/components/ui/`, consommant **exclusivement** les tokens du Lot 1. Chacun : une responsabilité, une interface claire, testable isolément.

| Composant | Props clés | Remplace (audit) |
|-----------|-----------|------------------|
| `Button` | `variant: primary\|secondary\|destructive\|ghost`, `loading`, `disabled`, `icon?` | #2 (8 copies), hiérarchie boutons |
| `Input` | `label` (visible), `error?`, `keyboardType`, chaînage via `ref`/`returnKeyType` | #2 (15 copies), #6 |
| `Card` | `elevated?` | #2 |
| `ListRow` | `leading` (avatar/icon), `title`, `subtitle`, `trailing?`, `onPress` | #2 (listes animaux/events) |
| `SegmentedControl` | `options`, `value`, `onChange` | type d'event |
| `Chip` | `label`, `selected`, `onPress` (≥44pt) | délais rappel réglages |
| `FAB` | `icon`, `onPress`, élévation M3 | #3 (FAB "+") |
| `Icon` | `name`, `size`, `color` (token) — wrapper unique | #3 (emoji) |
| `EmptyState` | `icon`, `title`, `message`, `action?` | #5 |
| `ErrorState` | `message`, `onRetry` | #5 (cul-de-sac) |
| `Skeleton` | `variant: row\|card\|circle` | #5 (spinner nu) |
| `Toast` | `type: success\|error`, provider global | #5 (pas de confirmation) |

**Accessibilité intégrée au niveau composant** (pas à refaire par écran) : `Button`/`FAB`/`ListRow` portent `accessibilityRole` + `accessibilityLabel` ; `Icon` décoratif = `accessibilityElementsHidden`.

---

## 4. Migration écran par écran (Lot 3)

Remplacer tout pattern inline par les composants du Lot 2, écran par écran. Aucune couleur hardcodée ne subsiste (`bg-blue-600`, `text-black dark:text-white`, `#9ca3af` → tokens). Ordre : auth (sign-in/up, forgot/reset) → animaux (liste, new, detail) → events (new, detail, scan) → réglages → home. Chaque écran migré = livrable testable, parité fonctionnelle stricte.

Sous-tâches structurelles incluses (audit #8) :
- Renommer `explore.tsx` → `settings.tsx` (+ route/tab).
- Home : retirer la déconnexion (→ Réglages), remplacer le bloc "Connecté ✓" par du contenu utile (raccourci animaux + rappels à venir). Onboarding reste mais via composant propre.
- Détail animal : séparer visuellement en sections `Card` (profil / actions / timeline) plutôt qu'un scroll indifférencié.

---

## 5. Formulaires (Lot 4)

- **Date pickers natifs** via `@react-native-community/datetimepicker` (compatible Expo SDK 56) → supprime la saisie texte `"AAAA-MM-JJ"` et la regex. Champs : event `date`, `nextDueDate`.
- **Espèce** : sélecteur avec suggestions courantes (Chien, Chat, Lapin, Oiseau, NAC…) + saisie libre en repli.
- Labels visibles (via `Input.label`), validation par champ en temps réel (blur + submit), notes multiline `min-h` correct.
- Chaînage clavier : `returnKeyType="next"` + focus programmatique champ suivant.

---

## 6. Icônes · états · a11y (Lot 5)

**Icônes** — remplacer tous les emoji :
- Lib : **`@expo/vector-icons`** (Ionicons + MaterialCommunityIcons), cross-platform, teinte template via token `color`. Mapping : 🐾→`paw`, 💉→`needle`/`syringe`, 💊→`pill`, 🩺→`stethoscope`, 📷→`camera`, 📄→`document-text`, 🔔→`notifications`, `+`→`add`.
- Tab bar : 3 icônes distinctes (home / paw / settings), corriger les 2 `explore.png` identiques.

**États** :
- `Skeleton` au chargement des listes/détails (remplace spinner nu).
- `EmptyState` avec icône + message + CTA (liste animaux → "Ajouter", timeline → "Ajouter un événement").
- `ErrorState` avec bouton **Réessayer** (liste animaux, détail event) — fin des culs-de-sac.
- **Pull-to-refresh** (`RefreshControl`) sur listes animaux + timeline.
- **Toast** succès sur save animal / save réglages / création event.

**A11y** : labels/roles portés par les composants (Lot 2) → vérification par écran ; contraste placeholders corrigé par token `text-tertiary` ; cibles ≥44pt vérifiées.

---

## 7. Micro-interactions (Lot 6)

- **`expo-haptics`** (à installer) : `impactAsync` léger sur save/toggle, `notificationAsync` sur succès/erreur, warning sur delete.
- **`reanimated`** (déjà présent v4) : press-scale sur `Button`/`ListRow`, entrée en fondu des lignes de liste, slide-in du `Toast`. Léger, respect `prefers-reduced-motion` si dispo.

---

## 8. Dépendances & ordre

```
Lot 1 (design system)
  └─> Lot 2 (composants)
        └─> Lot 3 (migration écrans)
        └─> Lot 4 (formulaires)   ┐
        └─> Lot 5 (icônes/états)  ├─ réordonnables entre eux
        └─> Lot 6 (micro-inter.)  ┘
```

Lots 1→2→3 séquentiels stricts. 4/5/6 dépendent de 2, priorisables librement après 3.

**Nouvelles dépendances à installer :** `@react-native-community/datetimepicker`, `@expo/vector-icons`, `expo-haptics` (toutes via `npx expo install` pour compat SDK 56).

## 9. Hors-scope (confirmé)

Partage vet/pet-sitter, multi-user, graphs poids, B2B, abonnement. Aucun changement backend/API (refonte 100 % côté `app/`). Pas de réactivation de l'extraction IA (reste derrière `AI_EXTRACTION_ENABLED`).

## 10. Critères de succès

- 0 couleur hardcodée / variante `dark:` manuelle dans les écrans (tout via tokens).
- 0 pattern Button/Input copié-collé (tout via composants).
- 0 emoji dans l'UI fonctionnelle (icônes système).
- Dates saisies via picker natif.
- Chaque écran : loading (skeleton), empty (CTA), error (retry) traités.
- Actions interactives : label a11y + cible ≥44pt.
- Dark mode cohérent sur les 14 écrans.
