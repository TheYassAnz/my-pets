import { useSyncExternalStore } from 'react';

import { Colors } from '@/constants/theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export const THEME_STORAGE_KEY = 'mypets.theme';

const QUERY = '(prefers-color-scheme: dark)';
const isPref = (v: unknown): v is ThemePreference => v === 'system' || v === 'light' || v === 'dark';

function readStored(): ThemePreference {
  try {
    const v = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    return isPref(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

let preference: ThemePreference = readStored();
const listeners = new Set<() => void>();

const media = () => globalThis.matchMedia?.(QUERY);
const systemDark = () => media()?.matches ?? false;

export function resolveColorScheme(pref: ThemePreference, dark: boolean): 'light' | 'dark' {
  return pref === 'system' ? (dark ? 'dark' : 'light') : pref;
}

// Applique le thème résolu au document (attribut, color-scheme, barre du navigateur).
function applyToDocument() {
  if (typeof document === 'undefined') return;
  const resolved = resolveColorScheme(preference, systemDark());
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', Colors[resolved].surface);
}

function notify() {
  applyToDocument();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  const mq = media();
  // Un gestionnaire par abonné : se désabonner ne retire que le sien.
  const onChange = () => {
    applyToDocument();
    listener();
  };
  mq?.addEventListener?.('change', onChange);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    mq?.removeEventListener?.('change', onChange);
  };
}

export function getThemePreference(): ThemePreference {
  return preference;
}

export function setThemePreference(pref: ThemePreference): void {
  preference = pref;
  try {
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // stockage indisponible : la préférence reste en mémoire
  }
  notify();
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, getThemePreference, () => 'system');
}

export function useResolvedColorScheme(): 'light' | 'dark' {
  return useSyncExternalStore(
    subscribe,
    () => resolveColorScheme(preference, systemDark()),
    () => 'light',
  );
}

applyToDocument();
