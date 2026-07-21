import { render, screen, fireEvent } from '@testing-library/react-native';

import { ListRow } from '@/components/ui/list-row';

describe('ListRow', () => {
  it('affiche le titre et le sous-titre', async () => {
    await render(<ListRow title="Rex" subtitle="Chien" />);

    expect(screen.getByText('Rex')).toBeTruthy();
    expect(screen.getByText('Chien')).toBeTruthy();
  });

  it('est un bouton accessible quand elle est pressable', async () => {
    const onPress = jest.fn();
    await render(<ListRow title="Rex" subtitle="Chien" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Rex, Chien' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('n’est pas un bouton quand elle n’est pas pressable', async () => {
    await render(<ListRow title="Rex" subtitle="Chien" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
