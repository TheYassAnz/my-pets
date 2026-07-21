import { render, screen, fireEvent } from '@testing-library/react-native';

import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('affiche un label visible', async () => {
    await render(<Input label="Nom" value="" onChangeText={jest.fn()} />);

    expect(screen.getByText('Nom')).toBeTruthy();
  });

  it('remonte la saisie', async () => {
    const onChangeText = jest.fn();
    await render(<Input label="Nom" value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByLabelText('Nom'), 'Rex');

    expect(onChangeText).toHaveBeenCalledWith('Rex');
  });

  it('affiche le message d’erreur et l’intègre au nom accessible du champ', async () => {
    // React Native n'a pas d'équivalent de aria-invalid : le seul moyen fiable
    // d'annoncer l'erreur est de la joindre au libellé lu par le lecteur d'écran.
    await render(<Input label="Nom" value="" onChangeText={jest.fn()} error="Nom requis" />);

    expect(screen.getByText('Nom requis')).toBeTruthy();
    expect(screen.getByLabelText('Nom, erreur : Nom requis')).toBeTruthy();
  });

  it('n’affiche pas de zone d’erreur quand il n’y a pas d’erreur', async () => {
    await render(<Input label="Nom" value="" onChangeText={jest.fn()} />);

    expect(screen.queryByText('Nom requis')).toBeNull();
  });
});
