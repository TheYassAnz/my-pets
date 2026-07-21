import { render, screen } from '@testing-library/react-native';

import { Badge } from '@/components/ui/badge';

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
});
