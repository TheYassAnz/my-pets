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
});
