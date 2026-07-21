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

  it('annonce le message aux lecteurs d’écran iOS', async () => {
    // `accessibilityLiveRegion` est Android-only : sans announceForAccessibility,
    // VoiceOver resterait muet sur le toast.
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
