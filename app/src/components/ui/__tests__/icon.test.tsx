import { render, screen } from '@testing-library/react-native';

import { Icon } from '@/components/ui/icon';

describe('Icon', () => {
  it('expose un nom accessible quand il est porteur de sens', async () => {
    await render(<Icon name="paw" label="Animal" />);

    expect(screen.getByLabelText('Animal')).toBeTruthy();
  });

  it('est masqué aux lecteurs d’écran quand il est décoratif', async () => {
    // Inspecter les props de masquage, et non l'absence d'un label jamais passé :
    // sinon le test passe même si la branche décorative est cassée.
    await render(<Icon name="paw" decorative testID="deco" />);

    // RNTL exclut par défaut les nœuds masqués aux lecteurs d'écran des requêtes :
    // includeHiddenElements est nécessaire pour récupérer celui-ci et inspecter ses props.
    const node = screen.getByTestId('deco', { includeHiddenElements: true });
    expect(node.props.accessibilityElementsHidden).toBe(true);
    expect(node.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(node.props.accessibilityLabel).toBeUndefined();
  });
});
