# Phrases de chargement du splash — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sous le logo du splash de lancement, afficher des phrases humoristiques qui tournent (« Nettoyage des litières… », « Ravitaillement des croquettes… ») pendant le chargement.

**Architecture:** Le splash est du HTML pur dans `app/public/index.html` (`#splash`), affiché avant même le chargement du bundle JS et retiré par `hideSplash()` (`app/src/lib/splash.ts`) quand la session est restaurée. On ajoute un `<p id="splash-fun">` et un petit script inline qui fait tourner les phrases ; inline (et non un fichier `/splash.js`) pour rester couvert par le cache hors-ligne du service worker, qui ne met en cache que `/index.html` et `/_expo/static/`. Aucun changement React.

**Tech Stack:** HTML/CSS/JS ES5 inline (même style que les scripts existants de `index.html`), Jest (jest-expo) pour le test.

**Spec:** demande de Yassine du 2026-11-12 + réponses aux questions :
- Phrases rotatives dès l'apparition du splash ; le message existant « le serveur se réveille… » (après 6 s, `#splash-msg`) reste, ajouté **en dessous**, les phrases continuent.
- Ordre aléatoire sans répétition avant d'avoir vu toute la liste, changement toutes les ~2 s, fondu léger désactivé si « réduire les animations ».
- 12-15 phrases écrites par Claude (liste ci-dessous, à valider à la revue du plan).
- Splash initial seulement (pas le spinner « Réessayer » de `_layout.tsx`).

## Global Constraints

- Tout se passe dans `app/public/index.html` ; pas de nouveau fichier servi, pas de dépendance.
- Script en ES5 (`var`, `function`), comme les deux scripts existants du fichier.
- Intervalle : `2000` ms ; fondu : `200` ms (opacité), même durée que `#splash.splash-hide`.
- Le texte rotatif est `aria-hidden="true"` (sinon le `role="status"` du splash l'annoncerait toutes les 2 s) ; le message de réveil serveur reste lisible par les lecteurs d'écran.
- Phrases exactes (français, terminées par « … ») :
  1. Nettoyage des litières…
  2. Ravitaillement des croquettes…
  3. Remplissage des gamelles d'eau…
  4. Brossage des poils…
  5. Recherche de la balle sous le canapé…
  6. Négociation avec le chat…
  7. Promenade du chien…
  8. Comptage des moustaches…
  9. Réveil du hamster…
  10. Vérification du carnet de vaccins…
  11. Coupe des griffes…
  12. Distribution des friandises…
  13. Nettoyage de l'aquarium…
  14. Installation du panier…

## Review Focus

1. **Splash retiré pendant une rotation** (chargement rapide) → l'intervalle s'arrête, aucune erreur console, aucun timer orphelin. Test : `stoppe quand #splash disparaît`.
2. **Fin de cycle** → le re-mélange ne doit pas réafficher deux fois de suite la même phrase. Test : `jamais deux fois la même phrase d'affilée`.
3. **Mise en page** → le logo ne doit pas sauter quand la première phrase apparaît ni quand `#splash-msg` s'affiche à 6 s : `#splash-fun` a une hauteur réservée (`min-height: 20px`). Vérification manuelle (Step 6).
4. **Thème sombre** → le texte hérite de `color` de `#splash` (déjà géré clair/sombre), aucune couleur en dur sur `#splash-fun`. Vérification manuelle.
5. **`#splash-fun` absent** (template modifié, vieux shell en cache) → le script ne lève pas. Test : `ne lève pas sans #splash-fun`.

---

### Task 1: Phrases rotatives dans le splash

**Files:**
- Modify: `app/public/index.html` (CSS dans `#splash-style`, `<p id="splash-fun">` dans `#splash`, nouveau `<script id="splash-fun-script">`)
- Create: `app/src/__tests__/splash-phrases.test.ts`

**Interfaces:**
- Consumes: `#splash` existant ; `hideSplash()` le retire du DOM (inchangé).
- Produces: `<p id="splash-fun" aria-hidden="true">` placé entre l'`<img>` et `#splash-msg` ; classe `splash-fun-out` (opacité 0) pendant le fondu ; le script inline porte `id="splash-fun-script"` (le test l'extrait par cet id).

- [ ] **Step 1: Write the failing test** — `app/src/__tests__/splash-phrases.test.ts`

Le test lit `public/index.html` avec `fs`, extrait le contenu de `<script id="splash-fun-script">` par regex, et l'exécute avec `new Function(code)()` après avoir mocké `globalThis.document` (même technique que `src/lib/__tests__/splash.test.ts`) et activé `jest.useFakeTimers()`. Élément simulé : `{ textContent: '', classList: { add: jest.fn(), remove: jest.fn() } }` ; `getElementById('splash')` renvoie un objet non nul tant que le test ne le « retire » pas. Un helper `tick()` avance de `2000` puis `200` ms et renvoie `el.textContent`.

```ts
it('affiche une phrase immédiatement', () => {
  run();
  expect(el.textContent).toMatch(/…$/);
});

it('change de phrase toutes les 2 s avec un fondu de 200 ms', () => {
  run();
  const first = el.textContent;
  jest.advanceTimersByTime(2000);
  expect(el.classList.add).toHaveBeenCalledWith('splash-fun-out');
  expect(el.textContent).toBe(first);
  jest.advanceTimersByTime(200);
  expect(el.classList.remove).toHaveBeenCalledWith('splash-fun-out');
  expect(el.textContent).not.toBe(first);
});

it('montre toute la liste (12-15 phrases) sans répétition dans un cycle', () => {
  run();
  const seen = [el.textContent, ...Array.from({ length: 99 }, tick)];
  const all = new Set(seen);
  expect(all.size).toBeGreaterThanOrEqual(12);
  expect(all.size).toBeLessThanOrEqual(15);
  expect(new Set(seen.slice(0, all.size)).size).toBe(all.size);
  expect(all).toContain('Nettoyage des litières…');
  expect(all).toContain('Ravitaillement des croquettes…');
});

it("jamais deux fois la même phrase d'affilée", () => {
  run();
  const seen = [el.textContent, ...Array.from({ length: 200 }, tick)];
  seen.slice(1).forEach((t, i) => expect(t).not.toBe(seen[i]));
});

it('stoppe quand #splash disparaît', () => {
  run();
  splashPresent = false;
  expect(() => tick()).not.toThrow();
  expect(jest.getTimerCount()).toBe(0);
});

it('ne lève pas sans #splash-fun', () => {
  // getElementById('splash-fun') → null
  expect(() => run({ withFun: false })).not.toThrow();
  expect(jest.getTimerCount()).toBe(0);
});
```

Pour le test « jamais d'affilée », forcer quelques limites de cycle défavorables avec `jest.spyOn(Math, 'random')` n'est pas nécessaire : 200 ticks couvrent ~14 re-mélanges.

- [ ] **Step 2: Run test to verify it fails**

Run (depuis `app/`) : `npx jest src/__tests__/splash-phrases.test.ts`
Expected: FAIL — le script `splash-fun-script` est introuvable dans `index.html`.

- [ ] **Step 3: Implémenter dans `app/public/index.html`**

- HTML : `<p id="splash-fun" aria-hidden="true"></p>` entre l'`<img>` et `#splash-msg`.
- CSS (dans `#splash-style`) : `#splash-fun { margin: 20px 0 0; min-height: 20px; font-size: 15px; line-height: 20px; text-align: center; transition: opacity 200ms; }`, `#splash-fun.splash-fun-out { opacity: 0; }`, `@media (prefers-reduced-motion: reduce) { #splash-fun { transition: none; } }`. Réduire `#splash-msg` à `margin: 12px 0 0`.
- Script `<script id="splash-fun-script">`, placé **avant** le script du réveil serveur, en IIFE :
  - `PHRASES` = la liste des Global Constraints ;
  - mélange Fisher-Yates d'une copie ; au re-mélange, si la première phrase du nouveau cycle est égale à la dernière affichée, l'échanger avec la deuxième ;
  - affiche la première phrase tout de suite ; `setInterval` à 2000 ms : si `document.getElementById('splash')` est nul → `clearInterval` et sortie ; sinon ajouter `splash-fun-out`, puis `setTimeout` 200 ms qui pose la phrase suivante et retire la classe ;
  - sortie immédiate (sans timer) si `#splash-fun` est absent.

Le script du réveil serveur à 6 s reste inchangé.

- [ ] **Step 4: Run test to verify it passes**

Run : `npx jest src/__tests__/splash-phrases.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Suite complète + lint**

Run : `npm test && npm run lint`
Expected: tous les tests passent, lint sans erreur.

- [ ] **Step 6: Vérification visuelle**

`npm run web` puis ouvrir http://localhost:8081 avec l'API **arrêtée** et le throttling réseau « Slow 3G » (DevTools) pour garder le splash à l'écran. Attendu : une phrase sous le logo dès l'affichage, qui change en fondu toutes les ~2 s ; à 6 s, le message « le serveur se réveille… » apparaît en dessous sans faire bouger le logo ; correct en thème clair et sombre ; avec « réduire les animations » (DevTools → Rendering → `prefers-reduced-motion`), changement sans fondu.

- [ ] **Step 7: Commit**

```bash
git add app/public/index.html app/src/__tests__/splash-phrases.test.ts
git commit -m "feat(app): phrases rotatives sous le logo du splash"
```
