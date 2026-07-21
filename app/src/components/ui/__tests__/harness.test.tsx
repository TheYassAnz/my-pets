/// <reference types="jest" />
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

describe('harnais de test', () => {
  it('rend un composant et le trouve par son rôle accessible', async () => {
    await render(
      <Pressable accessibilityRole="button" accessibilityLabel="Valider">
        <Text>Valider</Text>
      </Pressable>,
    );

    expect(screen.getByRole('button', { name: 'Valider' })).toBeTruthy();
  });

  it('déclenche onPress', async () => {
    const onPress = jest.fn();
    await render(
      <Pressable accessibilityRole="button" accessibilityLabel="Valider" onPress={onPress}>
        <Text>Valider</Text>
      </Pressable>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Valider' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
