import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';
export type SyncState = 'idle' | 'syncing' | 'offline' | 'error';

interface AppState {
  selectedAnimalId: string | null;
  themePreference: ThemePreference;
  syncState: SyncState;
  lastSyncedAt: number | null;
  isOffline: boolean;
  syncErrorMessage: string | null;

  setSelectedAnimalId: (id: string | null) => void;
  setThemePreference: (pref: ThemePreference) => void;
  setSyncState: (state: SyncState, errorMessage?: string | null) => void;
  setOffline: (offline: boolean) => void;
  recordSyncSuccess: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedAnimalId: null,
  themePreference: 'system',
  syncState: 'idle',
  lastSyncedAt: null,
  isOffline: false,
  syncErrorMessage: null,

  setSelectedAnimalId: (id) => set({ selectedAnimalId: id }),
  setThemePreference: (themePreference) => set({ themePreference }),
  setSyncState: (syncState, syncErrorMessage = null) => set({ syncState, syncErrorMessage }),
  setOffline: (isOffline) => set({ isOffline, syncState: isOffline ? 'offline' : 'idle' }),
  recordSyncSuccess: () =>
    set({ lastSyncedAt: Date.now(), syncState: 'idle', syncErrorMessage: null }),
}));
