import { act, renderHook } from '@testing-library/react-native';

import {
  getThemePreference,
  resolveColorScheme,
  setThemePreference,
  THEME_STORAGE_KEY,
  useResolvedColorScheme,
} from '@/lib/color-scheme';

type G = { localStorage?: unknown; matchMedia?: unknown };
const g = global as G;

function mockStorage(initial: Record<string, string> = {}, opts: { getThrows?: boolean; setThrows?: boolean } = {}) {
  const store = { ...initial };
  g.localStorage = {
    getItem: (k: string) => {
      if (opts.getThrows) throw new Error('boom');
      return store[k] ?? null;
    },
    setItem: (k: string, v: string) => {
      if (opts.setThrows) throw new Error('boom');
      store[k] = v;
    },
  };
  return store;
}

// Recharge le module pour qu'il relise localStorage (sans rendre de React).
function freshPreference() {
  let pref = '';
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- rechargement de module
    pref = (require('@/lib/color-scheme') as typeof import('@/lib/color-scheme')).getThemePreference();
  });
  return pref;
}

let matches: boolean;
let changeListeners: Set<() => void>;
const fireChange = () => changeListeners.forEach((l) => l());

beforeEach(() => {
  matches = false;
  changeListeners = new Set();
  mockStorage();
  g.matchMedia = jest.fn(() => ({
    get matches() {
      return matches;
    },
    addEventListener: (_: string, l: () => void) => {
      changeListeners.add(l);
    },
    removeEventListener: (_: string, l: () => void) => {
      changeListeners.delete(l);
    },
  }));
});

afterEach(() => {
  delete g.localStorage;
  delete g.matchMedia;
});

describe('resolveColorScheme', () => {
  it.each([
    ['system', true, 'dark'],
    ['system', false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
  ] as const)('%s / systemDark=%s -> %s', (pref, dark, expected) => {
    expect(resolveColorScheme(pref, dark)).toBe(expected);
  });
});

describe('getThemePreference (démarrage)', () => {
  it("vaut 'system' si rien n'est stocké", () => {
    expect(freshPreference()).toBe('system');
  });

  it("vaut 'system' si la valeur stockée est invalide", () => {
    mockStorage({ [THEME_STORAGE_KEY]: 'violet' });
    expect(freshPreference()).toBe('system');
  });

  it("vaut 'system' si getItem lève", () => {
    mockStorage({}, { getThrows: true });
    expect(freshPreference()).toBe('system');
  });
});

describe('setThemePreference', () => {
  it('persiste et met à jour la préférence', () => {
    const store = mockStorage();
    setThemePreference('dark');
    expect(store[THEME_STORAGE_KEY]).toBe('dark');
    expect(getThemePreference()).toBe('dark');
  });

  it('ne lève pas si setItem lève', () => {
    mockStorage({}, { setThrows: true });
    expect(() => setThemePreference('dark')).not.toThrow();
    expect(getThemePreference()).toBe('dark');
  });
});

describe('useResolvedColorScheme', () => {
  it('suit la préférence explicite', async () => {
    setThemePreference('system');
    const { result } = await renderHook(() => useResolvedColorScheme());
    expect(result.current).toBe('light');
    await act(async () => setThemePreference('dark'));
    expect(result.current).toBe('dark');
  });

  it('suit le système en préférence system', async () => {
    setThemePreference('system');
    const { result } = await renderHook(() => useResolvedColorScheme());
    expect(result.current).toBe('light');
    await act(async () => {
      matches = true;
      fireChange();
    });
    expect(result.current).toBe('dark');
  });

  it('garde les autres abonnés à jour après un démontage', async () => {
    setThemePreference('system');
    const first = await renderHook(() => useResolvedColorScheme());
    const second = await renderHook(() => useResolvedColorScheme());
    await act(async () => first.unmount());
    await act(async () => {
      matches = true;
      fireChange();
    });
    expect(second.result.current).toBe('dark');
  });

  it('ignore le système en préférence light', async () => {
    setThemePreference('light');
    const { result } = await renderHook(() => useResolvedColorScheme());
    await act(async () => {
      matches = true;
      fireChange();
    });
    expect(result.current).toBe('light');
  });
});
