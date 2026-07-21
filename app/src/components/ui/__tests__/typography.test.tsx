// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('../../../../tailwind.config.js');

// Un seul invariant testé : la forme de chaque entrée. Lister à nouveau les six
// noms serait recopier la config pour la comparer à elle-même.
// Pas de rendu ici : ce test reste synchrone (seuls les tests qui appellent
// `render`/`fireEvent` ont besoin d'être `async`).
describe('échelle typographique', () => {
  it('associe une interligne à chaque taille de texte', () => {
    const sizes = config.theme.extend.fontSize;

    expect(Object.keys(sizes).length).toBeGreaterThan(0);

    for (const [role, value] of Object.entries(sizes)) {
      // Forme attendue : ['16px', { lineHeight: '22px' }].
      // Une taille sans interligne casse le rythme vertical sans erreur visible.
      expect(Array.isArray(value)).toBe(true);
      expect(typeof (value as [string, object])[0]).toBe('string');
      expect((value as [string, { lineHeight?: string }])[1]?.lineHeight).toEqual(
        expect.stringMatching(/^\d+px$/),
      );
      expect(role).toMatch(/^[a-z]+$/);
    }
  });
});
