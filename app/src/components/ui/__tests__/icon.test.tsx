import { render, screen } from '@testing-library/react-native';

import { Icon } from '@/components/ui/icon';
import { Colors } from '@/constants/theme';

describe('Icon', () => {
  it('utilise la couleur de texte du thème par défaut, jamais le noir du vendor', async () => {
    // @expo/vector-icons retombe sur DEFAULT_ICON_COLOR = 'black' quand `color`
    // est undefined (create-icon-set.js). Sans thème explicite, l'icône serait
    // invisible sur les surfaces sombres (EmptyState, ErrorState, Toast).
    await render(<Icon name="paw" decorative testID="themed" />);

    const node = screen.getByTestId('themed', { includeHiddenElements: true });
    const styles = Array.isArray(node.props.style) ? node.props.style : [node.props.style];
    const resolvedColor = styles.find((style) => style && 'color' in style)?.color;

    expect(resolvedColor).toBe(Colors.light.text);
    expect(resolvedColor).not.toBe('black');
  });

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
