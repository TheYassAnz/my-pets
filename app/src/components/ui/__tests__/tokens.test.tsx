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
