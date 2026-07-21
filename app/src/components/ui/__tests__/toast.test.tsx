import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { AccessibilityInfo, Button as RNButton } from 'react-native';

import { ToastProvider, useToast } from '@/components/ui/toast';

function Probe() {
  const { show } = useToast();
  return <RNButton title="déclencher" onPress={() => show('Réglages enregistrés')} />;
}

describe('Toast', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('n’affiche rien tant qu’aucun toast n’est demandé', async () => {
    await render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    expect(screen.queryByText('Réglages enregistrés')).toBeNull();
  });

  it('affiche le message demandé', async () => {
    await render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('déclencher'));

    expect(screen.getByText('Réglages enregistrés')).toBeTruthy();
  });

  it('disparaît après 3 secondes', async () => {
    await render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('déclencher'));
    // act asynchrone : forme vérifiée empiriquement avec RNTL 14 + fake timers.
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Réglages enregistrés')).toBeNull();
  });

  it('réarme le délai quand un second toast remplace le premier', async () => {
    await render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('déclencher'));
    // 2 s plus tard, on déclenche un second toast : il doit vivre 3 s pleines,
    // et non être coupé au bout d'1 s par le timer du premier.
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await fireEvent.press(screen.getByText('déclencher'));
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText('Réglages enregistrés')).toBeTruthy();
  });

  it('annonce le message aux lecteurs d’écran (iOS et Android)', async () => {
    // Mécanisme d'annonce unique : announceForAccessibility couvre les deux
    // plateformes, donc sans cet appel aucun lecteur d'écran n'annoncerait le toast.
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    await fireEvent.press(screen.getByText('déclencher'));

    expect(announce).toHaveBeenCalledWith('Réglages enregistrés');
    announce.mockRestore();
  });

  it('lève une erreur si useToast est utilisé hors provider', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // `render` étant asynchrone, l'erreur remonte en rejet de promesse,
    // pas en throw synchrone.
    await expect(render(<Probe />)).rejects.toThrow(/ToastProvider/);

    spy.mockRestore();
  });
});
