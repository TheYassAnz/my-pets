import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Card } from '@/components/ui/card';

describe('Card', () => {
  it('rend son contenu', async () => {
    await render(
      <Card>
        <Text>Carnet de santé</Text>
      </Card>,
    );

    expect(screen.getByText('Carnet de santé')).toBeTruthy();
  });

  it('expose le testID fourni par l’appelant, pour le cibler depuis un écran', async () => {
    await render(
      <Card testID="animal-card">
        <Text>Carnet de santé</Text>
      </Card>,
    );

    expect(screen.getByTestId('animal-card')).toBeTruthy();
  });
});
