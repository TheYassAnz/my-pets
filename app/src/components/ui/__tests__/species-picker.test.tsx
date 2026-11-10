import { render, screen } from '@testing-library/react-native';

import { SpeciesPicker } from '@/components/ui/species-picker';

describe('SpeciesPicker', () => {
  it('rend le libellé du champ', async () => {
    await render(<SpeciesPicker label="Espèce" value="Chien" onChange={jest.fn()} />);

    expect(screen.getByText('Espèce')).toBeTruthy();
  });

  it('affiche le message d’erreur', async () => {
    await render(
      <SpeciesPicker label="Espèce" value="Chien" onChange={jest.fn()} error="Espèce requise" />,
    );

    expect(screen.getByText('Espèce requise')).toBeTruthy();
  });
});
