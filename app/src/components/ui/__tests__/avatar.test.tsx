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

describe('Avatar tailles et pastille', () => {
  it.each([
    ['xs', 32],
    ['sm', 44],
    ['md', 60],
    ['lg', 92],
    ['xl', 112],
  ] as const)('taille %s = %d', async (size, d) => {
    await render(<Avatar size={size} testID="a" />);
    const style = [screen.getByTestId('a').props.style].flat();
    expect(style).toContainEqual(expect.objectContaining({ width: d, height: d }));
  });

  it('affiche la pastille uniquement si editable', async () => {
    await render(<Avatar editable testID="a" />);
    expect(screen.getByTestId('a-badge', { includeHiddenElements: true })).toBeTruthy();
  });

  it('sans editable, pas de pastille', async () => {
    await render(<Avatar testID="a" />);
    expect(screen.queryByTestId('a-badge', { includeHiddenElements: true })).toBeNull();
  });
});
