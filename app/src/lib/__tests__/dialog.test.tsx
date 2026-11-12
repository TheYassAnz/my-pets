import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { DialogHost } from '@/components/ui/dialog-host';
import { confirmAction, notifyError } from '@/lib/dialog';

describe('dialog sans hôte', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([true, false])('confirmAction renvoie la réponse de window.confirm (%s)', async (answer) => {
    const confirm = jest.fn().mockReturnValue(answer);
    window.confirm = confirm;
    await expect(confirmAction('Titre', 'Message')).resolves.toBe(answer);
    expect(confirm).toHaveBeenCalledWith('Titre\nMessage');
  });

  it('notifyError affiche le message via window.alert', () => {
    const alert = jest.fn();
    window.alert = alert;
    notifyError('Oups');
    expect(alert).toHaveBeenCalledWith('Oups');
  });
});

describe('dialog avec DialogHost', () => {
  const ask = () =>
    confirmAction('Supprimer cet événement ?', 'Cette action est irréversible.', {
      confirmLabel: 'Supprimer',
      destructive: true,
    });

  it('confirmer résout true et ferme la modale', async () => {
    await render(<DialogHost />);
    let result!: Promise<boolean>;
    await act(async () => { result = ask(); });
    expect(screen.getByText('Supprimer cet événement ?')).toBeTruthy();
    expect(screen.getByText('Cette action est irréversible.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Supprimer'));
    await expect(result).resolves.toBe(true);
    expect(screen.queryByText('Supprimer cet événement ?')).toBeNull();
  });

  it('annuler résout false', async () => {
    await render(<DialogHost />);
    let result!: Promise<boolean>;
    await act(async () => { result = ask(); });
    await fireEvent.press(screen.getByText('Annuler'));
    await expect(result).resolves.toBe(false);
  });

  it('deux appels successifs : false puis true', async () => {
    await render(<DialogHost />);
    let first!: Promise<boolean>;
    await act(async () => { first = ask(); });
    await fireEvent.press(screen.getByText('Annuler'));
    await expect(first).resolves.toBe(false);
    let second!: Promise<boolean>;
    await act(async () => { second = ask(); });
    await fireEvent.press(screen.getByText('Supprimer'));
    await expect(second).resolves.toBe(true);
  });

  it('notifyError affiche OK sans Annuler', async () => {
    await render(<DialogHost />);
    await act(async () => notifyError('Oups'));
    expect(screen.getByText('Oups')).toBeTruthy();
    expect(screen.queryByText('Annuler')).toBeNull();
    await fireEvent.press(screen.getByText('OK'));
    expect(screen.queryByText('Oups')).toBeNull();
  });
});
