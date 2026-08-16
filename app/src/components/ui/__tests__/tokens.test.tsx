/// <reference types="node" />
import fs from 'fs';
import path from 'path';

import { Colors } from '@/constants/theme';

// Ces tests vérifient des invariants du thème, pas les valeurs elles-mêmes :
// verrouiller les hex ferait un test change-detector qui casse à chaque
// ajustement de palette sans rien attraper de réel.
describe('tokens de couleur', () => {
  it('expose les mêmes clés en light et en dark', async () => {
    // Une clé présente d'un seul côté = token invisible ou plantage dans un thème.
    expect(Object.keys(Colors.light).sort()).toEqual(Object.keys(Colors.dark).sort());
  });

  it('donne une valeur distincte à chaque token entre les deux thèmes', async () => {
    // Un token identique en light et dark trahit un oubli de calibrage.
    for (const key of Object.keys(Colors.light) as (keyof typeof Colors.light)[]) {
      expect(Colors.light[key]).not.toBe(Colors.dark[key]);
    }
  });
});

// Deux systèmes de tokens coexistent : les variables CSS de global.css
// (source pour NativeWind, via les classes Tailwind) et l'objet Colors ici
// (source pour les props qui exigent une couleur résolue, ex. `color` sur
// Icon, `placeholderTextColor` sur Input). Leur synchronisation n'était
// affirmée que par un commentaire — jamais vérifiée. On lit donc global.css
// comme du texte brut (l'import direct est mocké en test, voir jest.config.js
// : les fichiers .css sont remplacés par style-mock.js) pour comparer les
// deux sources indépendamment.
describe('synchronisation Colors (theme.ts) / global.css', () => {
  const css = fs.readFileSync(path.join(__dirname, '../../../global.css'), 'utf8');

  const DARK_MEDIA_MARKER = '@media (prefers-color-scheme: dark)';
  const darkMarkerIndex = css.indexOf(DARK_MEDIA_MARKER);
  if (darkMarkerIndex === -1) {
    throw new Error(`Bloc "${DARK_MEDIA_MARKER}" introuvable dans global.css`);
  }
  // Bloc clair : tout ce qui précède le bloc dark (contient le :root de base).
  const lightBlock = css.slice(0, darkMarkerIndex);
  // Bloc sombre : le reste du fichier, à partir de la media query.
  const darkBlock = css.slice(darkMarkerIndex);

  function readCssColor(block: string, cssVar: string): string {
    // Valeurs stockées en triplet "R G B" (canaux séparés, pour <alpha-value>).
    const match = new RegExp(`${cssVar}:\\s*([0-9]+)\\s+([0-9]+)\\s+([0-9]+)`).exec(block);
    if (!match) {
      throw new Error(`Variable "${cssVar}" introuvable dans le bloc attendu de global.css`);
    }
    const [, r, g, b] = match;
    return (
      '#' +
      [r, g, b]
        .map((channel) => Number(channel).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  }

  // Correspondance explicite JS -> CSS. `danger` est volontairement exclu :
  // c'est un alias Tailwind vers `status-late` (même rouge, sémantique
  // différente — erreur/destructif vs échéance dépassée), sans variable CSS
  // propre dans global.css.
  const JS_TO_CSS_VAR: Record<string, string> = {
    surface: '--color-surface',
    surfaceElevated: '--color-surface-elevated',
    surfaceSunken: '--color-surface-sunken',
    border: '--color-border',
    text: '--color-text',
    textSecondary: '--color-text-secondary',
    textTertiary: '--color-text-tertiary',
    primary: '--color-primary',
    primaryPressed: '--color-primary-pressed',
    onPrimary: '--color-on-primary',
    statusOk: '--color-status-ok',
    statusSoon: '--color-status-soon',
    statusLate: '--color-status-late',
    dangerSurface: '--color-danger-surface',
  };

  it('a les mêmes valeurs hex que les variables CSS correspondantes, en light et en dark', async () => {
    for (const [jsKey, cssVar] of Object.entries(JS_TO_CSS_VAR)) {
      const key = jsKey as keyof typeof Colors.light;
      expect(Colors.light[key]).toBe(readCssColor(lightBlock, cssVar));
      expect(Colors.dark[key]).toBe(readCssColor(darkBlock, cssVar));
    }
  });
});
