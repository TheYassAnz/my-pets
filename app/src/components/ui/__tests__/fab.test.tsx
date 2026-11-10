import { render, screen, fireEvent } from '@testing-library/react-native';

import { FAB } from '@/components/ui/fab';

describe('FAB', () => {
  it("porte un nom accessible malgre l'absence de texte visible", async () => {
    await render(<FAB icon="add" label="Ajouter un animal" onPress={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Ajouter un animal' })).toBeTruthy();
  });

  it('declenche onPress', async () => {
    const onPress = jest.fn();
    await render(<FAB icon="add" label="Ajouter un animal" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Ajouter un animal' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('expose le testID fourni par l’appelant, pour le cibler depuis un écran', async () => {
    await render(
      <FAB icon="add" label="Ajouter un animal" onPress={jest.fn()} testID="add-animal-fab" />,
    );

    expect(screen.getByTestId('add-animal-fab')).toBeTruthy();
  });

  it('accepte une classe fournie par l’appelant pour se positionner', async () => {
    // Le FAB consommait `style` en interne : sans className, un écran ne
    // pouvait pas du tout le positionner (ex. absolute bottom-6 right-6).
    await render(
      <FAB
        icon="add"
        label="Ajouter un animal"
        onPress={jest.fn()}
        testID="add-animal-fab"
        className="absolute bottom-6 right-6"
      />,
    );

    expect(screen.getByTestId('add-animal-fab').props.className).toEqual(
      expect.stringContaining('absolute bottom-6 right-6'),
    );
  });
});
