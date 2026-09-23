import { useAppStore } from '../use-app-store';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedAnimalId: null,
      themePreference: 'system',
      syncState: 'idle',
      lastSyncedAt: null,
      isOffline: false,
      syncErrorMessage: null,
    });
  });

  it('met à jour l’animal sélectionné', () => {
    useAppStore.getState().setSelectedAnimalId('animal-123');
    expect(useAppStore.getState().selectedAnimalId).toBe('animal-123');
  });

  it('met à jour la préférence de thème', () => {
    useAppStore.getState().setThemePreference('dark');
    expect(useAppStore.getState().themePreference).toBe('dark');
  });

  it('gère l’état de synchronisation et hors ligne', () => {
    useAppStore.getState().setOffline(true);
    expect(useAppStore.getState().isOffline).toBe(true);
    expect(useAppStore.getState().syncState).toBe('offline');

    useAppStore.getState().setOffline(false);
    expect(useAppStore.getState().isOffline).toBe(false);

    useAppStore.getState().recordSyncSuccess();
    expect(useAppStore.getState().syncState).toBe('idle');
    expect(useAppStore.getState().lastSyncedAt).toBeGreaterThan(0);
  });
});
