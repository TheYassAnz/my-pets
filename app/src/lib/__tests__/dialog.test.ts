import { confirmAction, notifyError } from '@/lib/dialog';

describe('dialog', () => {
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
