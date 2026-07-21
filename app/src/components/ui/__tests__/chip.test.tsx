import { render, screen, fireEvent } from '@testing-library/react-native';

import { Chip } from '@/components/ui/chip';

describe('Chip', () => {
  it('déclenche onPress', async () => {
    const onPress = jest.fn();
    await render(<Chip label="J-15" selected={false} onPress={onPress} />);

    await fireEvent.press(screen.getByRole('checkbox', { name: 'J-15' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('expose son état sélectionné', async () => {
    await render(<Chip label="J-15" selected onPress={jest.fn()} />);

    expect(
      screen.getByRole('checkbox', { name: 'J-15' }).props.accessibilityState.checked,
    ).toBe(true);
  });
});
