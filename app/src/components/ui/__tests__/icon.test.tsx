import { render, screen } from '@testing-library/react-native';

import { Icon } from '@/components/ui/icon';

describe('Icon', () => {
  it('expose un nom accessible quand il est porteur de sens', async () => {
    await render(<Icon name="paw" label="Animal" />);

    expect(screen.getByLabelText('Animal')).toBeTruthy();
  });

  it('est masqué aux lecteurs d’écran quand il est décoratif', async () => {
    await render(<Icon name="paw" decorative />);

    expect(screen.queryByLabelText('Animal')).toBeNull();
  });
});
