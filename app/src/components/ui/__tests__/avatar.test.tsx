import { render, screen } from '@testing-library/react-native';

import { Avatar } from '@/components/ui/avatar';

describe('Avatar', () => {
  it('affiche la photo quand une URI est fournie', async () => {
    await render(<Avatar uri="https://example.test/rex.jpg" label="Photo de Rex" />);

    expect(screen.getByLabelText('Photo de Rex')).toBeTruthy();
  });

  it('affiche le repli quand aucune URI n’est fournie', async () => {
    await render(<Avatar label="Photo de Rex" testID="avatar" />);

    // Le repli est une icône décorative dans un conteneur : pas d'image rendue.
    expect(screen.queryByLabelText('Photo de Rex')).toBeNull();
    expect(screen.getByTestId('avatar')).toBeTruthy();
  });
});
