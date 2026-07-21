import { render, screen } from '@testing-library/react-native';

import { Badge } from '@/components/ui/badge';
import { Colors } from '@/constants/theme';

describe('Badge', () => {
  it('affiche son libellé', async () => {
    await render(<Badge label="Vaccin" />);

    expect(screen.getByText('Vaccin')).toBeTruthy();
  });

  it('n’est pas annoncé comme un bouton', async () => {
    // Un badge est purement informatif : le présenter comme actionnable
    // tromperait les utilisateurs de lecteurs d'écran.
    await render(<Badge label="Vaccin" icon="vaccine" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('colore son icône selon le ton, pas seulement pour `primary`', async () => {
    // Régression : le glyphe d'un badge `warning` était rendu dans
    // `textSecondary` (gris) alors que le libellé était déjà en `warning`
    // (ambre) — un badge visiblement incohérent.
    await render(<Badge label="Rappel" icon="alert" tone="warning" testID="warning-badge" />);

    const iconNode = screen.getByTestId('warning-badge-icon', { includeHiddenElements: true });
    const styles = Array.isArray(iconNode.props.style) ? iconNode.props.style : [iconNode.props.style];
    const resolvedColor = styles.find((style) => style && 'color' in style)?.color;

    expect(resolvedColor).toBe(Colors.light.warning);
    expect(resolvedColor).not.toBe(Colors.light.textSecondary);
  });
});
