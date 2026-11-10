import { render, screen, fireEvent } from '@testing-library/react-native';

import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('déclenche onPress au tap', async () => {
    const onPress = jest.fn();
    await render(<Button label="Enregistrer" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ne déclenche pas onPress quand il est désactivé', async () => {
    const onPress = jest.fn();
    await render(<Button label="Enregistrer" disabled onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('masque le libellé et se déclare occupé pendant le chargement', async () => {
    await render(<Button label="Enregistrer" loading />);

    expect(screen.queryByText('Enregistrer')).toBeNull();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer' }).props.accessibilityState).toMatchObject(
      { busy: true, disabled: true },
    );
  });

  it('ne déclenche pas onPress pendant le chargement', async () => {
    const onPress = jest.fn();
    await render(<Button label="Enregistrer" loading onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('expose le testID fourni par l’appelant, pour le cibler depuis un écran', async () => {
    await render(<Button label="Enregistrer" testID="save-button" />);

    expect(screen.getByTestId('save-button')).toBeTruthy();
  });

  it('primary a un fond plein et un texte contrasté, secondary un fond neutre', async () => {
    await render(
      <>
        <Button label="Plein" testID="p" />
        <Button label="Neutre" variant="secondary" testID="s" />
      </>,
    );

    expect(screen.getByTestId('p').props.className).toContain('bg-primary');
    expect(screen.getByText('Plein').props.className).toContain('text-on-primary');
    expect(screen.getByTestId('s').props.className).toContain('bg-surface-sunken');
  });

  it('ghost et destructive sont sans fond plein', async () => {
    await render(
      <>
        <Button label="Texte" variant="ghost" testID="g" />
        <Button label="Supprimer" variant="destructive" testID="d" />
      </>,
    );

    expect(screen.getByTestId('g').props.className).not.toContain('bg-');
    expect(screen.getByTestId('d').props.className).not.toContain('bg-');
    expect(screen.getByText('Supprimer').props.className).toContain('text-danger');
  });
});
