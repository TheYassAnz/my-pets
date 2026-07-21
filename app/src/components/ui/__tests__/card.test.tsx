import { fireEvent, render, screen } from '@testing-library/react-native';
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

  it('est un bouton accessible quand elle est pressable', async () => {
    const onPress = jest.fn();
    await render(
      <Card onPress={onPress} accessibilityLabel="Fiche de Rex">
        <Text>Rex</Text>
      </Card>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Fiche de Rex' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('n’est pas un bouton quand elle n’est pas pressable', async () => {
    await render(
      <Card>
        <Text>Rex</Text>
      </Card>,
    );

    expect(screen.queryByRole('button')).toBeNull();
  });
});
