import { render, screen } from '@testing-library/react-native';

import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  it('affiche son libellé quand il est fourni', async () => {
    await render(<Badge state="ok" label="À jour" />);

    expect(screen.getByText('À jour')).toBeTruthy();
  });

  it('reste affichable sans libellé (point seul)', async () => {
    await render(<Badge state="soon" testID="dot-only" />);

    expect(screen.getByTestId('dot-only')).toBeTruthy();
  });

  it('n’est pas annoncé comme un bouton', async () => {
    await render(<Badge state="late" label="Rappel" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('colore le point selon l’état', async () => {
    await render(<Badge state="late" label="Rappel" testID="late-badge" />);

    const dot = screen.getByTestId('late-badge-dot');

    expect(dot.props.className).toContain('bg-status-late');
  });
});
